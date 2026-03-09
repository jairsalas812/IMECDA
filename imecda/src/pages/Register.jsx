import { useState } from "react";
import { addUser } from "../firestoreServices/FirestoreService";

function Register() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    addUser(name, email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text"
        placeholder="Nombre"
        onChange={(e) => setName(e.target.value)}
      />

      <input 
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button type="submit">Guardar</button>
    </form>
  );
}

export default Register;