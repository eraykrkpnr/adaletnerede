"use client"; // Bu satır eklenmeli
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Harita bileşenini SSR devre dışı bırakılmış şekilde yükle
const Map = dynamic(() => import("../components/Map"), { ssr: false });

export default function Home() {
  const [protests, setProtests] = useState([]);

  useEffect(() => {
    fetch("/api/protests")
        .then((res) => res.json())
        .then((data) => setProtests(data));
  }, []);

  return (
      <div className="w-screen h-screen">
        <Map protests={protests} />
      </div>
  );
}
