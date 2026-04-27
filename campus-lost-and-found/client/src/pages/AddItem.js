import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

const AddItem = () => {
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // This line "talks" to the database
      await addDoc(collection(db, "items"), {
        name: itemName,
        location: location,
        status: "lost", // or "found"
        createdAt: serverTimestamp(),
      });
      alert("Item posted to the database!");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white text-center">Quick Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="Item Name" 
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          onChange={(e) => setItemName(e.target.value)} 
          required
        />
        <input 
          type="text" 
          placeholder="Location" 
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          onChange={(e) => setLocation(e.target.value)} 
          required
        />
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-bold"
        >
          Post Item
        </button>
      </form>
    </div>
  );
};

export default AddItem;
