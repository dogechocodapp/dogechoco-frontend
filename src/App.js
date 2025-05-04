import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import logo from "./assets/logo.png";

const ADMIN_WALLET = "0x4794d0B88F5579117Ca8e7ab8FF8b5f95DbD0213".toLowerCase();

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Instala MetaMask para continuar");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (err) {
      alert("No se pudo conectar con MetaMask");
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return alert("Escribe un mensaje primero.");
    if (!walletAddress) return alert("Conecta tu wallet primero.");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      const res = await fetch("http://localhost:3001/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, message, signature }),
      });

      if (res.ok) {
        setMessage("");
        fetchMessages();
        alert("✅ Mensaje firmado y enviado correctamente");
      } else {
        alert("❌ Error al enviar el mensaje");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Firma cancelada o error con MetaMask");
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/messages");
      const data = await res.json();
      setMessages(data.reverse());
    } catch (err) {
      console.error("Error al obtener mensajes:", err);
    }
  };

  const downloadMessages = async () => {
    const adminMsg = "Soy el administrador de la dApp";

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(adminMsg);

      const res = await fetch("http://localhost:3001/api/admin/messages-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });

      if (!res.ok) return alert("❌ No autorizado para descargar mensajes");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fecha = new Date().toISOString().split("T")[0];
      a.download = `respaldo-mensajes-${fecha}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error al firmar:", err);
      alert("❌ Firma cancelada o error");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center text-center">
      <img
        src={logo}
        alt="DogeChoco"
        className="w-72 sm:w-96 md:w-[400px] lg:w-[500px] mb-4"
      />

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
        MIGRATION TO{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
          SOLANA
        </span>
      </h1>

      {!walletAddress ? (
        <button
          onClick={connectWallet}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full shadow mb-6 text-sm sm:text-base"
        >
          Conectar Wallet
        </button>
      ) : (
        <div className="w-full max-w-xl">
          <p className="mb-2 text-sm sm:text-base">
            <strong>Wallet conectada:</strong> {walletAddress}
          </p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje al administrador..."
            rows={4}
            className="w-full border border-gray-400 rounded p-3 mb-3"
          />

          <button
            onClick={sendMessage}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded shadow font-semibold"
          >
            Firmar y Enviar mensaje
          </button>
        </div>
      )}

      {walletAddress?.toLowerCase() === ADMIN_WALLET && (
        <div className="mt-10 w-full max-w-2xl text-left">
          <h2 className="text-xl font-bold mb-3 flex items-center">
            📩 Mensajes recibidos:
          </h2>

          <button
            onClick={downloadMessages}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full mb-4 shadow"
          >
            Descargar mensajes (.json)
          </button>

          {messages.length === 0 ? (
            <p>No hay mensajes aún.</p>
          ) : (
            <ul className="space-y-4">
              {messages.map((msg, index) => (
                <li key={index} className="bg-white border p-4 rounded shadow">
                  <p className="text-sm text-gray-500">
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                  <p>
                    <strong>{msg.walletAddress}:</strong> {msg.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
