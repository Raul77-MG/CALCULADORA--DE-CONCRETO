class Vista {
    constructor() {
        this.tipo = document.getElementById("tipo");
        this.descripcion = document.getElementById("descripcion");
        this.veces = document.getElementById("veces");
        this.largo = document.getElementById("largo");
        this.ancho = document.getElementById("ancho");
        this.alto = document.getElementById("alto");
        this.btnAgregar = document.getElementById("agregar");
        this.contenedorTablas = document.getElementById("tablas");
        this.totalGeneral = document.getElementById("totalGeneral");



        // NUEVO: preview refs
        this.previewCard = document.getElementById("previewCard");
        this.previewTipo = document.getElementById("previewTipo");
        this.previewImg = document.getElementById("previewImg");
        this.previewDesc = document.getElementById("previewDesc");
        this.previewDims = document.getElementById("previewDims");
        this.previewVol = document.getElementById("previewVol");
        }


    actualizarPreview({ tipo, descripcion, largo, ancho, alto }) {
        const base = "./img/previews/";
        const map = {
            Columna: "columna.png",
            Viga: "viga.png",
            Losa: "losa.png",
            Placa: "placa.png",
            Zapata: "zapata.jpg",
        };

        this.previewTipo.textContent = tipo || "—";
        this.previewDesc.textContent = descripcion?.trim() ? descripcion.trim() : "—";

        const L = Number(largo) || 0;
        const A = Number(ancho) || 0;
        const H = Number(alto) || 0;

        this.previewDims.textContent = `${L.toFixed(2)} × ${A.toFixed(2)} × ${H.toFixed(2)}`;
        this.previewVol.textContent = (L * A * H).toFixed(3);

        const file = map[tipo] || "placeholder.png";
        const url = base + file;

        //  DEBUG 
        console.log("Cargando preview:", url);

        // fallback si algo falla
        this.previewImg.onerror = () => {
            console.warn("No se pudo cargar:", url);
            this.previewImg.src = base + "placeholder.png";
        };

        this.previewCard.classList.add("is-updating");
        this.previewImg.src = url;

        setTimeout(() => this.previewCard.classList.remove("is-updating"), 160);
    }



    actualizarTablas(items, subtotales, eliminarFilaCallback) {
        this.contenedorTablas.innerHTML = "";

        const agrupado = {};
        items.forEach((item, index) => {
            if (!agrupado[item.tipo]) agrupado[item.tipo] = [];
            agrupado[item.tipo].push({...item, index}); // guardamos el índice para eliminar
        });

        for (const tipo in agrupado) {
            const bloque = document.createElement("div");
            bloque.classList.add("card", "tabla-card");

            let html = `
                <h2>${tipo}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th>N° veces</th>
                            <th>Largo</th>
                            <th>Ancho</th>
                            <th>Alto</th>
                            <th>Volumen (m³)</th>
                            <th>Subtotal (m³)</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            agrupado[tipo].forEach(it => {
                html += `
                    <tr>
                        <td>${it.descripcion}</td>
                        <td>${it.veces}</td>
                        <td>${it.largo}</td>
                        <td>${it.ancho}</td>
                        <td>${it.alto}</td>
                        <td>${(it.volumen * it.veces).toFixed(3)}</td>
                        <td></td>
                        <td><button class="btn-eliminar" data-index="${it.index}">❌</button></td>
                    </tr>
                `;
            });

            // Fila subtotal
            html += `
                <tr class="fila-subtotal">
                    <td colspan="6"></td>
                    <td style="font-weight:bold;">
                        ${(subtotales[tipo] || 0).toFixed(3)}
                    </td>
                    <td></td>
                </tr>
            `;

            html += `
                    </tbody>
                </table>
            `;

            bloque.innerHTML = html;
            this.contenedorTablas.appendChild(bloque);
        }

        // Agregar eventos a los botones de eliminar
        const botonesEliminar = this.contenedorTablas.querySelectorAll(".btn-eliminar");
        botonesEliminar.forEach(btn => {
            btn.addEventListener("click", () => {
                const index = parseInt(btn.getAttribute("data-index"));
                eliminarFilaCallback(index);
            });
        });
    }

    actualizarTotalGeneral(total) {
        this.totalGeneral.innerHTML = `Total General: ${total.toFixed(3)} m³`;
    }

    limpiarInputs() {
        this.descripcion.value = "";
        this.veces.value = 1;
        this.largo.value = "";
        this.ancho.value = "";
        this.alto.value = "";
    }
}
