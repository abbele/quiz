import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import inquirer from "inquirer"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the nam

const DATA_FILE = path.join(__dirname, 'questions.json');

// Load questions from JSON file or initialize empty
function loadQuestions() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save questions back to JSON file
function saveQuestions(questions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2));
}

// Shuffle array (Fisher-Yates)
function shuffle(array) {
  const clone = array.slice();
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

async function generatePdf(questions) {
  const doc = new PDFDocument();
  const outputPath = path.join(__dirname, `quiz_${Date.now()}.pdf`);
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  const shuffled = shuffle(questions);
  doc.fontSize(20).text('Quiz Domande', { align: 'center' });
  doc.moveDown();

  shuffled.forEach((q, index) => {
    doc.fontSize(14).text(`${index + 1}. ${q.question}`);
    q.answers.forEach((ans, idx) => {
      doc.text(`   ${String.fromCharCode(65 + idx)}. ([ ]) ${ans}`);
    });
    doc.moveDown();
  });

  doc.end();

  writeStream.on('finish', () => {
    console.log(`PDF generato: ${outputPath}`);
  });
}

async function addQuestion(questions) {
  const { question } = await inquirer.prompt([
    {
      type: 'input',
      name: 'question',
      message: 'Inserisci la domanda: '
    }
  ]);

  const answers = [];
  for (let i = 1; i <= 3; i++) {
    const { ans } = await inquirer.prompt([
      {
        type: 'input',
        name: 'ans',
        message: `Risposta ${i}: `
      }
    ]);
    answers.push(ans);
  }

  questions.push({ question, answers });
  saveQuestions(questions);
  console.log('Domanda e risposte salvate con successo.');
}

async function main() {
  const questions = loadQuestions();

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: "Scegli un'opzione:",
      choices: [
        { name: '1 - Stampa domande (esporta in PDF)', value: 'print' },
        { name: '2 - Inserisci una domanda', value: 'add' }
      ]
    }
  ]);

  if (choice === 'print') {
    if (questions.length === 0) {
      console.log('Non ci sono domande da stampare.');
    } else {
      await generatePdf(questions);
    }
  } else if (choice === 'add') {
    await addQuestion(questions);
  }
}

main().catch(err => console.error(err));
