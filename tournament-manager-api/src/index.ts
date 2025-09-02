import express from "express";
import mongoose, { model, Schema } from "mongoose";
import { Kafka } from "kafkajs";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tournament_designer';

const kafka = new Kafka({
  clientId: 'tournament-designer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'] // Usa variable de entorno para flexibilidad
});

const producer = kafka.producer();


async function sendToKafka(topic: string, message: any) {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  await producer.disconnect();
}

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Pass to next layer of middleware
    next();
});

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));

// Conexión a Kafka
producer.connect()
  .then(() => console.log("✅ Conectado a Kafka"))
  .catch((err) => console.error("❌ Error conectando a Kafka:", err));


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
  // Here you would handle the data upload logic
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

app.post("/registrar", async (req, res) => {
  try{
    const data = req.body;

    console.log("Datos Recibidos:", data);

    // Insertar en la colección "tournaments" de la base de datos
    await Tournament.insertMany(req.body);

    // Enviar a Kafka
    await sendToKafka('tournament-registrations', req.body);

    res.status(201).json({ message: `Se insertaron ${req.body.length} torneos y se encoló en Kafka!` });
  }
  catch(error){
    console.error("Error al insertar torneos:", error);
    res.status(500).json({ message: "Error al insertar torneos" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});