class Modelo {
    constructor() {
        this.items = [];
    }

    agregar(tipo, descripcion, veces, largo, ancho, alto) {
        // Forzar valores numéricos
        veces = Number(veces) || 1;
        largo = Number(largo) || 0;
        ancho = Number(ancho) || 0;
        alto = Number(alto) || 0;

        const volumen = largo * ancho * alto;

        this.items.push({
            tipo,
            descripcion,
            veces,
            largo,
            ancho,
            alto,
            volumen
        });
    }

    obtenerItems() {
        return this.items;
    }

    obtenerSubtotales() {
        const subtotales = {};
        this.items.forEach(item => {
            if (!subtotales[item.tipo]) subtotales[item.tipo] = 0;
            subtotales[item.tipo] += item.volumen * item.veces;
        });
        return subtotales;
    }

    obtenerTotalGeneral() {
        return this.items.reduce((acc, it) => acc + (it.volumen * it.veces), 0);
    }
}
