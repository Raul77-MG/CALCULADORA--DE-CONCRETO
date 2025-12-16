class Controlador {
  constructor(vista, modelo) {
    this.vista = vista;
    this.modelo = modelo;

    // Botón agregar (seguro)
    if (this.vista.btnAgregar) {
      this.vista.btnAgregar.addEventListener("click", () => this.agregarItem());
    }

    // Botones export (seguros)
    const btnPDF = document.getElementById("btnPDF");
    if (btnPDF) btnPDF.addEventListener("click", () => this.exportarPDF());

    const btnExcel = document.getElementById("btnExcel");
    if (btnExcel) btnExcel.addEventListener("click", () => this.exportarExcel());

    // Preview reactivo (solo si existe el método)
    const onPreview = () => {
      if (typeof this.vista.actualizarPreview !== "function") return;

      this.vista.actualizarPreview({
        tipo: this.vista.tipo?.value ?? "",
        descripcion: this.vista.descripcion?.value ?? "",
        largo: this.vista.largo?.value ?? "",
        ancho: this.vista.ancho?.value ?? "",
        alto: this.vista.alto?.value ?? "",
      });
    };

    this.vista.tipo?.addEventListener("change", onPreview);
    this.vista.descripcion?.addEventListener("input", onPreview);
    this.vista.largo?.addEventListener("input", onPreview);
    this.vista.ancho?.addEventListener("input", onPreview);
    this.vista.alto?.addEventListener("input", onPreview);

    // Inicializar
    this.actualizarVista();
    onPreview();
  }

  agregarItem() {
    const tipo = (this.vista.tipo?.value || "").trim();
    const descripcion = (this.vista.descripcion?.value || "").trim();

    const veces = Number(this.vista.veces?.value);
    const largo = Number(this.vista.largo?.value);
    const ancho = Number(this.vista.ancho?.value);
    const alto = Number(this.vista.alto?.value);

    // Validación fuerte
    if (!tipo) return alert("Seleccione un tipo de metrado.");
    if (!descripcion) return alert("Ingrese una descripción.");

    if (!Number.isFinite(veces) || veces < 1) {
      return alert("N° de veces debe ser 1 o más.");
    }

    // dimensiones > 0
    if (!Number.isFinite(largo) || largo <= 0) return alert("Largo debe ser mayor a 0.");
    if (!Number.isFinite(ancho) || ancho <= 0) return alert("Ancho debe ser mayor a 0.");
    if (!Number.isFinite(alto) || alto <= 0) return alert("Alto debe ser mayor a 0.");

    this.modelo.agregar(tipo, descripcion, veces, largo, ancho, alto);
    this.actualizarVista();
    this.vista.limpiarInputs();

    // refrescar preview (si existe)
    if (typeof this.vista.actualizarPreview === "function") {
      this.vista.actualizarPreview({
        tipo: this.vista.tipo.value,
        descripcion: this.vista.descripcion.value,
        largo: this.vista.largo.value,
        ancho: this.vista.ancho.value,
        alto: this.vista.alto.value,
      });
    }
  }

  eliminarItem(index) {
    this.modelo.items.splice(index, 1);
    this.actualizarVista();
  }

  actualizarVista() {
    this.vista.actualizarTablas(
      this.modelo.obtenerItems(),
      this.modelo.obtenerSubtotales(),
      (index) => this.eliminarItem(index)
    );

    this.vista.actualizarTotalGeneral(this.modelo.obtenerTotalGeneral());
  }

  exportarPDF() {
    const bloques = document.querySelectorAll("#tablas .tabla-card");
    if (bloques.length === 0) return alert("No hay datos para exportar.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 40;

    // ===== LOGO =====
    const logo = new Image();
    logo.src = "img/procero.png"; // usa PNG


    const toNumber = (txt) => {
      if (txt == null) return NaN;
      const t = String(txt).trim()
        .replace(/\s+/g, "")
        .replace(",", ".")
        .replace(/[^0-9.\-]/g, "");
      const n = Number(t);
      return isNaN(n) ? NaN : n;
    };

    // ===== LOGO EN EL PDF (firma empresa) =====
    const logoWidth = 60;    // 🔹 más pequeño
    const logoHeight = 20;   // 🔹 proporcional
    const logoX = marginX;   // 🔹 alineado a la izquierda
    const logoY = 20;

    doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);




    // ====== Título ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Reporte de Volumen de Concreto", pageW / 2, 70, { align: "center" });


    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString()}`, pageW - marginX, 58, { align: "right" });

    let y = 100;
    let totalGeneral = 0;

    bloques.forEach((bloque, idx) => {
      const titulo = bloque.querySelector("h2")?.innerText?.trim() || `Tabla ${idx + 1}`;
      const tabla = bloque.querySelector("table");
      if (!tabla) return;

      // ===== Headers =====
      const headersAll = [];
      tabla.querySelectorAll("thead th").forEach(th => headersAll.push(th.innerText.trim()));

      const eliminarIndex = headersAll.findIndex(h => h.toLowerCase() === "eliminar");
      const headers = headersAll.filter((_, i) => i !== eliminarIndex);

      // indices IMPORTANTES (en el array final SIN eliminar)
      const idxDesc = headers.findIndex(h => h.toLowerCase().includes("descrip"));
      const idxVol  = headers.findIndex(h => h.toLowerCase().includes("volumen"));
      const idxSub  = headers.findIndex(h => h.toLowerCase().includes("subtotal"));

      // ===== Body =====
      const body = [];
      let subtotal = 0;

      tabla.querySelectorAll("tbody tr").forEach(tr => {
        const fila = [];
        const tds = Array.from(tr.querySelectorAll("td"));

        // construir fila sin eliminar
        tds.forEach((td, i) => {
          if (i === eliminarIndex) return;
          fila.push(td.innerText.trim());
        });

        // Ignorar filas sin descripción real (ej: fila 0 | 9 | 0)
        if (idxDesc !== -1) {
          const desc = (fila[idxDesc] || "").trim();
          if (desc === "" || desc === "0") {
            return; // saltar esta fila
          }
        }


        //  Ignorar fila subtotal que viene del HTML (la que solo tiene un número al final)
        const descVal = idxDesc !== -1 ? (fila[idxDesc] || "").trim() : "";
        const subVal  = idxSub  !== -1 ? (fila[idxSub]  || "").trim() : "";
        const volVal  = idxVol  !== -1 ? (fila[idxVol]  || "").trim() : "";
        const noVacios = fila.filter(v => (v || "").trim() !== "").length;
        const esFilaSubtotalUI = (!descVal && (subVal || volVal) && noVacios <= 2);

        if (!esFilaSubtotalUI) {
          // sumar subtotal desde Volumen (m³)
          if (idxVol !== -1) {
            const nVol = toNumber(fila[idxVol]);
            if (!isNaN(nVol)) subtotal += nVol;
          }
          body.push(fila);
        }
      });

      totalGeneral += subtotal;

      // Agregar fila subtotal correctamente en su columna
      const filaSubtotal = new Array(headers.length).fill("");
      if (idxSub !== -1) {
        // Deja "Subtotal:" en la penúltima columna (Volumen) o antes de Subtotal
        const labelCol = Math.max(0, idxSub - 1);
        filaSubtotal[labelCol] = "Subtotal:";
        filaSubtotal[idxSub] = subtotal.toFixed(3);
      } else {
        // fallback si por alguna razón no existe "Subtotal"
        filaSubtotal[headers.length - 2] = "Subtotal:";
        filaSubtotal[headers.length - 1] = subtotal.toFixed(3);
      }
      body.push(filaSubtotal);

      // Salto de página si hace falta
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      // Título bloque
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(titulo, marginX, y);
      y += 8;

      // Tabla
      doc.autoTable({
        startY: y,
        head: [headers],
        body,
        theme: "grid",
        margin: { left: marginX, right: marginX },

        styles: {
          fontSize: 9,
          cellPadding: 5,
          valign: "middle",
          lineColor: [220, 220, 220],
          lineWidth: 0.7,
        },

        headStyles: {
          fillColor: [22, 160, 133],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },

        columnStyles: (() => {
          const map = {};
          headers.forEach((h, i) => {
            const low = h.toLowerCase();
            if (i === idxDesc) map[i] = { halign: "left" };
            else if (
              low.includes("veces") || low.includes("largo") || low.includes("ancho") ||
              low.includes("alto") || low.includes("volumen") || low.includes("subtotal")
            ) map[i] = { halign: "right" };
            else map[i] = { halign: "center" };
          });
          return map;
        })(),

        // Pintar la ÚLTIMA FILA (subtotal) en gris y negrita
        didParseCell: function (data) {
          if (data.section !== "body") return;
          const isLastRow = data.row.index === body.length - 1;
          if (isLastRow) {
            data.cell.styles.fillColor = [238, 238, 238];
            data.cell.styles.fontStyle = "bold";
          }
        },

        didDrawPage: () => {
          const p = doc.internal.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(`Página ${p}`, pageW - marginX, 820, { align: "right" });
        }
      });

      y = doc.lastAutoTable.finalY + 20;
    });

    // TOTAL GENERAL al final (si no cabe, nueva página)
    if (y > 780) {
      doc.addPage();
      y = 60;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Total General: ${totalGeneral.toFixed(3)} m³`, pageW - marginX, y, { align: "right" });

    doc.save("reporte_volumen_concreto.pdf");
  }




  exportarExcel() {
    const bloques = document.querySelectorAll("#tablas .tabla-card");
    if (bloques.length === 0) return alert("No hay datos para exportar.");

    // REQUIERE xlsx-js-style (para estilos)
    const wb = XLSX.utils.book_new();
    const ws = {};
    let row = 0;

    const greenHeader = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "16A085" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };

    const cell = {
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };

    const leftCell = { ...cell, alignment: { horizontal: "left", vertical: "center" } };
    const rightCell = { ...cell, alignment: { horizontal: "right", vertical: "center" } };

    const subtotalRow = {
      ...cell,
      font: { bold: true },
      fill: { patternType: "solid", fgColor: { rgb: "EEEEEE" } }
    };

    const titleStyle = {
      font: { bold: true, sz: 14, color: { rgb: "1F4E79" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const blockTitleStyle = {
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const setCell = (r, c, v, s = {}) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      ws[ref] = { v, t: typeof v === "number" ? "n" : "s", s };
    };

    const toNumber = (txt) => {
      if (txt == null) return NaN;
      const t = String(txt).trim()
        .replace(/\s+/g, "")
        .replace(",", ".")
        .replace(/[^0-9.\-]/g, ""); // limpia m³, etc.
      const n = Number(t);
      return isNaN(n) ? NaN : n;
    };

    let totalGeneral = 0;
    let maxCols = 0;
    const colWidths = [];

    // Título general
    setCell(row, 0, "REPORTE DE VOLUMEN DE CONCRETO", titleStyle);
    row += 2;

    bloques.forEach((bloque, idx) => {
      const titulo = bloque.querySelector("h2")?.innerText?.trim() || `Tabla ${idx + 1}`;
      const tabla = bloque.querySelector("table");
      if (!tabla) return;

      // Headers
      const headersAll = [];
      tabla.querySelectorAll("thead th").forEach(th => headersAll.push(th.innerText.trim()));

      const eliminarIndex = headersAll.findIndex(h => h.toLowerCase() === "eliminar");
      const headers = headersAll.filter((_, i) => i !== eliminarIndex);

      const idxDesc = headers.findIndex(h => h.toLowerCase().includes("descrip"));
      const idxVol  = headers.findIndex(h => h.toLowerCase().includes("volumen"));
      const idxSub  = headers.findIndex(h => h.toLowerCase().includes("subtotal"));

      // Título bloque
      setCell(row, 0, titulo, blockTitleStyle);
      row++;

      // Header row
      headers.forEach((h, c) => {
        setCell(row, c, h, greenHeader);
        colWidths[c] = Math.max(colWidths[c] || 10, h.length + 2);
      });
      maxCols = Math.max(maxCols, headers.length);
      row++;

      // Body
      let subtotal = 0;
      const trs = tabla.querySelectorAll("tbody tr");

      trs.forEach(tr => {
        const tds = Array.from(tr.querySelectorAll("td"));
        const fila = [];

        tds.forEach((td, i) => {
          if (i === eliminarIndex) return;

          let value = "";

          //  Leemos correctamente la descripción si está en un elemento input, select, etc.
          const input = td.querySelector("input, select, textarea");

          if (input) {
            // Si es un input, seleccionamos su valor
            value = input.value || input.options?.[input.selectedIndex]?.text || "";
          } else {
            // Si es solo texto, tomamos el innerText de la celda
            value = td.innerText.trim();
          }

          //  Guardamos la descripción (asegurándonos que entre toda la información de la celda)
          fila.push(value);
        });

        // Ignorar filas técnicas o vacías
        if (idxDesc !== -1) {
          const desc = (fila[idxDesc] || "").trim();
          if (desc === "" || desc === "0") {
            return; // NO exportar esta fila
          }
        }

        // Detectar fila subtotal “visual” (solo tiene el número al final)
        const descVal = idxDesc !== -1 ? (fila[idxDesc] || "").trim() : "";
        const volVal  = idxVol  !== -1 ? (fila[idxVol]  || "").trim() : "";
        const subVal  = idxSub  !== -1 ? (fila[idxSub]  || "").trim() : "";
        const noVacios = fila.filter(v => (v || "").trim() !== "").length;
        const esFilaSubtotalUI = (!descVal && (subVal || volVal) && noVacios <= 2);

        // Escribir fila en Excel
        fila.forEach((text, c) => {
          //  Definir si esta columna debe ser numérica (según el header)
          const headerLower = headers[c].toLowerCase();
          const esNumerica =
            headerLower.includes("n°") ||
            headerLower.includes("veces") ||
            headerLower.includes("largo") ||
            headerLower.includes("ancho") ||
            headerLower.includes("alto") ||
            headerLower.includes("volumen") ||
            headerLower.includes("subtotal");

          //  Por defecto: texto (ej. "viga1", "viga2", etc.)
          let value = text;

          if (c === idxDesc) {
            value = String(text || "").trim();
          }

          //  Solo si la columna es numérica, convertir
          if (esNumerica) {
            const n = toNumber(text);
            value = !isNaN(n) ? Number(n.toFixed(3)) : "";
          }


          // Limpiar columna Subtotal en filas normales
          if (
            !esFilaSubtotalUI &&
            headerLower.includes("subtotal")

          ) {
            value = "";
          }

          let style = cell;
          if (c === idxDesc) style = leftCell;
          else if (
            headers[c].toLowerCase().includes("n°") ||
            headers[c].toLowerCase().includes("largo") ||
            headers[c].toLowerCase().includes("ancho") ||
            headers[c].toLowerCase().includes("alto") ||
            headers[c].toLowerCase().includes("volumen") ||
            headerLower.includes("subtotal")

          ) {
            style = rightCell;
          }

          if (esFilaSubtotalUI) style = subtotalRow;

          setCell(row, c, value, style);
          colWidths[c] = Math.max(colWidths[c] || 10, String(value).length + 2);
        });

        // Subtotal se calcula con volúmenes (no con la columna Subtotal)
        if (!esFilaSubtotalUI && idxVol !== -1) {
          const nVol = toNumber(fila[idxVol]);
          if (!isNaN(nVol)) subtotal += nVol;
        }

        row++;
      });

      // Fila Subtotal final
      if (idxSub !== -1) {
        setCell(row, idxSub, Number(subtotal.toFixed(3)), subtotalRow);
      }


      totalGeneral += subtotal;
      row += 2;
    });

    // Total general
    const colLabel = Math.max(0, maxCols - 2);
    const colVal   = Math.max(0, maxCols - 1);

    setCell(row, colLabel, "Total General:", { font: { bold: true }, alignment: { horizontal: "right" } });
    setCell(row, colVal, `${totalGeneral.toFixed(3)} m³`, { font: { bold: true }, alignment: { horizontal: "right" } });

    ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row, c: maxCols - 1 } });
    ws["!cols"] = colWidths.map(w => ({ wch: Math.min(Math.max(w, 10), 35) }));

    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "Volumen_Concreto.xlsx");
  }

  

}

document.addEventListener("DOMContentLoaded", () => {
  const vista = new Vista();
  const modelo = new Modelo();
  new Controlador(vista, modelo);
});