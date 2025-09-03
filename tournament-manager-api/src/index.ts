import express from "express";
import mongoose, { model, Schema } from "mongoose";
import { MongoClient } from "mongodb";
import { Kafka } from "kafkajs";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/tournament_designer';

const kafka = new Kafka({
  clientId: 'tournament-designer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});
const producer = kafka.producer();

// Conexión con MongoClient para el endpoint /registrar
const client = new MongoClient(MONGO_URI);
let torneosCollection: any;

async function conectarMongoYKafka() {
  await client.connect();
  const db = client.db();
  torneosCollection = db.collection('torneos');
  await producer.connect();
  console.log("✅ Conectado a MongoDB (MongoClient) y Kafka (Producer)");
}
conectarMongoYKafka().catch(console.error);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Conexión a MongoDB con Mongoose para los otros endpoints
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB (Mongoose)"))
  .catch((err) => console.error("❌ Error conectando a MongoDB (Mongoose):", err));

// Esquema y modelo para los endpoints originales
const tournamentSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    roster: [{
      id: { type: Number, required: true },
      name: { type: String, required: true },
      weight: { type: Number, required: true },
      age: { type: Number, required: true },
    }]
  },
  { timestamps: true }
);

const Tournament = model("Tournament", tournamentSchema);

app.post('/upload-data', async (req, res) => {
  const data = req.body;
  console.log("Data received:", data);

  await Tournament.insertMany(req.body);
  res.status(201).json({ message: `Inserted ${req.body.length} tournaments!` });
});

app.get('/fetch-tournaments', async (req, res) => {
  const tournaments = await Tournament.find();
  res.status(200).json(tournaments);
});

app.get("/", (req, res) => {
  res.json({ message: "Tournament Designer API is running!" });
});

// Endpoint /registrar usando MongoClient y Kafka Producer
app.post("/registrar", async (req, res) => {
  try {
    const registros = req.body;

    console.log("Registros recibidos:", registros);

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ error: "El cuerpo de la petición debe ser un array de torneos." });
    }

    // Insertar todos en la misma colección que usa Mongoose (tournaments)
    const result = await Tournament.insertMany(registros);

    // Enviar cada registro a Kafka
    for (const registro of registros) {
      await producer.send({
        topic: "tournament-manager",
        messages: [{ value: JSON.stringify(registro) }],
      });
    }

    res.status(201).json({
      mensaje: `Se insertaron ${result.length} torneos y fueron encolados en Kafka`,
      idsInsertados: result.map(r => r._id),
    });
  } catch (err: any) {
    console.error("Error al insertar torneos:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});