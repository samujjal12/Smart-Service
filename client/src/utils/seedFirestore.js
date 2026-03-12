import { db } from '../firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const BATCHES = ['Batch A', 'Batch B', 'Batch C'];

export async function seedInitialStudents() {
  const sampleNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Williams', 'Charlie Brown'];
  let idCounter = 1000;
  
  const batch = writeBatch(db);

  sampleNames.forEach((name, idx) => {
    const enrollmentId = `ENR${idCounter++}`;
    const studentBatch = BATCHES[idx % BATCHES.length];
    
    // Create reference in 'students' collection where Document ID is the enrollmentId
    const docRef = doc(collection(db, 'students'), enrollmentId);
    
    batch.set(docRef, {
      enrollmentId,
      name,
      batch: studentBatch,
      createdAt: new Date().toISOString()
    });
  });

  try {
    await batch.commit();
    console.log("Successfully seeded 5 initial students to Firestore!");
  } catch (error) {
    console.error("Error seeding students:", error);
  }
}
