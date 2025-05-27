import React, { useRef, useState } from "react";

function ChampiñonMarker() {
  const [imageFile, setImageFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [clickStart, setClickStart] = useState(null);
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setBoxes([]);
    setClickStart(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRelativeCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, e.clientX - rect.left),
      y: Math.max(0, e.clientY - rect.top),
    };
  };

  const handleClick = (e) => {
    const point = getRelativeCoords(e);

    if (!clickStart) {
      setClickStart(point);
    } else {
      const topLeft = {
        x: Math.min(clickStart.x, point.x),
        y: Math.min(clickStart.y, point.y),
      };
      const bottomRight = {
        x: Math.max(clickStart.x, point.x),
        y: Math.max(clickStart.y, point.y),
      };

      const width = bottomRight.x - topLeft.x;
      const height = bottomRight.y - topLeft.y;

      if (width > 5 && height > 5) {
        setBoxes((prev) => [...prev, { points: [topLeft, bottomRight] }]);
      }

      setClickStart(null);
    }
  };

  const sendToBackend = () => {
    if (!imageFile) return alert("Sube una imagen primero.");
    if (!temperature || !humidity)
      return alert("Ingresa temperatura y humedad.");

    const base64Image = imageSrc.split(",")[1];

    const payload = {
      image_base64: base64Image,
      annotations: boxes,
      temperatura: parseFloat(temperature),
      humedad: parseFloat(humidity),
    };

    fetch("http://localhost:8004/upload-image/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Enviado:", data);
        alert("Datos enviados correctamente.");
      })
      .catch((err) => {
        console.error("❌ Error:", err);
        alert("Error al enviar al backend.");
      });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Marcar champiñones + datos ambientales</h2>

      <div style={{ marginBottom: 10 }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Temperatura (°C): </label>
        <input
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          step="0.1"
          style={{ width: 80 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Humedad (%): </label>
        <input
          type="number"
          value={humidity}
          onChange={(e) => setHumidity(e.target.value)}
          step="0.1"
          style={{ width: 80 }}
        />
      </div>

      <div
        ref={containerRef}
        style={{ position: "relative", display: "inline-block" }}
        onClick={handleClick}
      >
        {imageSrc && (
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Seleccionada"
            style={{
              maxWidth: "100%",
              cursor: "crosshair",
              userSelect: "none",
              display: "block",
            }}
          />
        )}

        {boxes.map((box, index) => {
          const [topLeft, bottomRight] = box.points;
          const width = bottomRight.x - topLeft.x;
          const height = bottomRight.y - topLeft.y;

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: topLeft.y,
                left: topLeft.x,
                width,
                height,
                border: "2px solid red",
                pointerEvents: "none",
              }}
            />
          );
        })}

        {clickStart && (
          <div
            style={{
              position: "absolute",
              top: clickStart.y - 4,
              left: clickStart.x - 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "blue",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {boxes.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={sendToBackend}>Enviar al backend</button>
        </div>
      )}
    </div>
  );
}

export default ChampiñonMarker;
