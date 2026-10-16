const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Conexión a la base de datos (Docker resolverá el host 'mysql-db')
const db = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'colombia_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }

    console.log('Conectado exitosamente a la Base de Datos');
    connection.release();
});

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function isValidText(value, maxLength) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function renderPage(content, scripts = '') {
    return `<!doctype html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Territorio Colombia</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Literata:opsz,wght@7..72,650&display=swap');
                :root { color-scheme: light; --ink: #17211b; --muted: #58645d; --paper: #f4f5ef; --surface: #fffef9; --line: #d9ddd4; --green: #176b45; --green-dark: #0d4f32; --focus: #d58b22; }
                * { box-sizing: border-box; }
                body { margin: 0; min-height: 100vh; color: var(--ink); background: linear-gradient(135deg, #edf2e8 0%, var(--paper) 48%, #f4eee4 100%); font-family: 'DM Sans', sans-serif; }
                ::selection { color: #fff; background: var(--green); }
                .shell { width: min(1100px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0 64px; }
                header { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
                h1, h2 { font-family: 'Literata', serif; letter-spacing: -0.02em; }
                h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); }
                h2 { margin: 0 0 20px; font-size: 1.55rem; }
                p { color: var(--muted); line-height: 1.6; }
                a { color: var(--green-dark); font-weight: 700; text-underline-offset: 4px; }
                .panel { max-width: 760px; padding: 30px; background: var(--surface); border-radius: 14px; box-shadow: 0 16px 45px rgba(38, 52, 43, 0.11); }
                .type-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 28px; padding: 5px; background: #e9ece5; border-radius: 10px; }
                .type-switch label { position: relative; padding: 11px 16px; text-align: center; font-weight: 700; cursor: pointer; border-radius: 7px; }
                .type-switch input { position: absolute; opacity: 0; }
                .type-switch label:has(input:checked) { color: #fff; background: var(--green); }
                .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
                .field { display: grid; gap: 7px; }
                .field.full { grid-column: 1 / -1; }
                label, legend { font-size: 0.9rem; font-weight: 700; }
                input, select { width: 100%; min-height: 44px; padding: 10px 12px; color: var(--ink); background: #fff; border: 1px solid #b9c1b9; border-radius: 7px; font: inherit; }
                input:focus, select:focus, button:focus-visible, a:focus-visible { outline: 3px solid color-mix(in srgb, var(--focus) 55%, transparent); outline-offset: 2px; }
                .check { display: flex; align-items: center; gap: 10px; min-height: 44px; }
                .check input { width: 18px; min-height: 18px; accent-color: var(--green); }
                button { min-height: 46px; margin-top: 26px; padding: 0 22px; color: #fff; background: var(--green); border: 0; border-radius: 7px; font: 700 1rem 'DM Sans', sans-serif; cursor: pointer; }
                button:hover { background: var(--green-dark); }
                .actions { display: flex; align-items: center; gap: 20px; }
                [hidden] { display: none !important; }
                .tables { display: grid; gap: 30px; }
                .table-wrap { overflow-x: auto; background: var(--surface); border-radius: 12px; box-shadow: 0 14px 38px rgba(38, 52, 43, 0.09); }
                .table-title { padding: 22px 24px 0; }
                table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
                th, td { padding: 14px 18px; text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap; }
                th { color: var(--muted); background: #f1f3ed; font-size: 0.78rem; text-transform: uppercase; }
                tr:last-child td { border-bottom: 0; }
                @media (max-width: 620px) { .shell { padding-top: 28px; } header { align-items: flex-start; flex-direction: column; } .panel { padding: 22px; } .fields { grid-template-columns: 1fr; } .field.full { grid-column: auto; } }
            </style>
        </head>
        <body><main class="shell">${content}</main>${scripts}</body>
        </html>`;
}

app.get('/', (req, res) => {
    db.query('SELECT id, nombre FROM departamentos ORDER BY nombre', (err, departamentos) => {
        if (err) {
            console.error('Error consultando departamentos:', err.message);
            return res.status(500).send('No se pudo cargar el formulario. Intenta nuevamente.');
        }

        const opciones = departamentos
            .map(({ id, nombre }) => `<option value="${id}">${escapeHtml(nombre)} (ID: ${id})</option>`)
            .join('');
        const content = `
            <header><div><h1>Territorio Colombia</h1><p>Registra la información territorial en la base de datos.</p></div><a href="/ver">Consultar registros</a></header>
            <section class="panel">
                <h2>Nuevo registro</h2>
                <form action="/ingresar" method="POST" id="registro-form">
                    <div class="type-switch" role="radiogroup" aria-label="Tipo de registro">
                        <label><input type="radio" name="tipo" value="municipio" checked>Municipio</label>
                        <label><input type="radio" name="tipo" value="departamento">Departamento</label>
                    </div>
                    <div class="fields">
                        <div class="field full"><label for="nombre">Nombre</label><input id="nombre" name="nombre" maxlength="100" required></div>
                        <div class="field"><label for="poblacion">Población</label><input id="poblacion" name="poblacion" type="number" min="0" required></div>
                    </div>
                    <div id="municipio-fields" class="fields">
                        <div class="field"><label for="departamento_id">Departamento</label><select id="departamento_id" name="departamento_id" required>${opciones}</select></div>
                        <div class="field"><label for="area_km2">Área (km²)</label><input id="area_km2" name="area_km2" type="number" min="0" step="0.01" required></div>
                        <div class="field"><label for="clima">Clima</label><input id="clima" name="clima" maxlength="50" required></div>
                        <label class="check"><input name="es_capital" type="checkbox" value="1">Es capital</label>
                    </div>
                    <div id="departamento-fields" class="fields" hidden>
                        <div class="field"><label for="region">Región</label><input id="region" name="region" maxlength="50" required disabled></div>
                        <div class="field"><label for="fecha_creacion">Fecha de creación</label><input id="fecha_creacion" name="fecha_creacion" type="date" required disabled></div>
                        <div class="field"><label for="presupuesto">Presupuesto</label><input id="presupuesto" name="presupuesto" type="number" min="0" step="0.01" required disabled></div>
                        <label class="check"><input name="es_costero" type="checkbox" value="1" disabled>Es costero</label>
                    </div>
                    <div class="actions"><button type="submit">Guardar registro</button><a href="/ver">Ver todos</a></div>
                </form>
            </section>`;
        const scripts = `<script>
            const typeInputs = document.querySelectorAll('input[name="tipo"]');
            const municipioFields = document.querySelector('#municipio-fields');
            const departamentoFields = document.querySelector('#departamento-fields');
            function updateFields() {
                const isMunicipio = document.querySelector('input[name="tipo"]:checked').value === 'municipio';
                municipioFields.hidden = !isMunicipio;
                departamentoFields.hidden = isMunicipio;
                municipioFields.querySelectorAll('input, select').forEach(field => field.disabled = !isMunicipio);
                departamentoFields.querySelectorAll('input, select').forEach(field => field.disabled = isMunicipio);
            }
            typeInputs.forEach(input => input.addEventListener('change', updateFields));
        </script>`;
        res.send(renderPage(content, scripts));
    });
});

app.post('/ingresar', (req, res) => {
    const { tipo, nombre, poblacion } = req.body;
    const poblacionNumero = Number(poblacion);

    if (!isValidText(nombre, 100) || !Number.isInteger(poblacionNumero) || poblacionNumero < 0 || poblacionNumero > 2147483647) {
        return res.status(400).send('El nombre y la población son obligatorios y deben ser válidos.');
    }

    let query;
    let values;
    if (tipo === 'municipio') {
        const departamentoId = Number(req.body.departamento_id);
        const area = Number(req.body.area_km2);
        if (!Number.isInteger(departamentoId) || departamentoId < 1 || !Number.isFinite(area) || area < 0 || !isValidText(req.body.clima, 50)) {
            return res.status(400).send('Completa correctamente los campos del municipio.');
        }
        query = `INSERT INTO municipios (departamento_id, nombre, poblacion, area_km2, clima, es_capital)
                 VALUES (?, ?, ?, ?, ?, ?)`;
        values = [departamentoId, nombre.trim(), poblacionNumero, area, req.body.clima.trim(), req.body.es_capital === '1'];
    } else if (tipo === 'departamento') {
        const presupuesto = Number(req.body.presupuesto);
        if (!isValidText(req.body.region, 50) || !isValidDate(req.body.fecha_creacion) || !Number.isFinite(presupuesto) || presupuesto < 0 || presupuesto >= 10000000000000) {
            return res.status(400).send('Completa correctamente los campos del departamento.');
        }
        query = `INSERT INTO departamentos (nombre, region, poblacion, fecha_creacion, es_costero, presupuesto)
                 VALUES (?, ?, ?, ?, ?, ?)`;
        values = [nombre.trim(), req.body.region.trim(), poblacionNumero, req.body.fecha_creacion, req.body.es_costero === '1', presupuesto];
    } else {
        return res.status(400).send('Selecciona un tipo de registro válido.');
    }

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error guardando registro:', err.message);
            return res.status(500).send('No se pudo guardar el registro. Verifica los datos e intenta nuevamente.');
        }
        if (result.affectedRows !== 1) {
            return res.status(500).send('La base de datos no confirmó el registro. Intenta nuevamente.');
        }
        res.redirect(`/ver?creado=${tipo}&id=${result.insertId}`);
    });
});

app.get('/ver', (req, res) => {
    const departamentosQuery = `SELECT id, nombre, region, poblacion, DATE_FORMAT(fecha_creacion, '%Y-%m-%d') AS fecha_creacion, es_costero, presupuesto FROM departamentos ORDER BY id`;
    const municipiosQuery = `SELECT m.id, m.departamento_id, d.nombre AS departamento, m.nombre AS municipio, m.poblacion, m.area_km2, m.clima, m.es_capital FROM municipios m JOIN departamentos d ON m.departamento_id = d.id ORDER BY m.id`;
    db.query(departamentosQuery, (err, departamentos) => {
        if (err) {
            console.error('Error consultando departamentos:', err.message);
            return res.status(500).send('No se pudieron consultar los registros. Intenta nuevamente.');
        }
        db.query(municipiosQuery, (municipiosErr, municipios) => {
            if (municipiosErr) {
                console.error('Error consultando municipios:', municipiosErr.message);
                return res.status(500).send('No se pudieron consultar los registros. Intenta nuevamente.');
            }
            const departamentosRows = departamentos.map(row => `<tr><td>${row.id}</td><td>${escapeHtml(row.nombre)}</td><td>${escapeHtml(row.region)}</td><td>${row.poblacion}</td><td>${row.fecha_creacion}</td><td>${row.es_costero ? 'Sí' : 'No'}</td><td>${row.presupuesto}</td></tr>`).join('');
            const municipiosRows = municipios.map(row => `<tr><td>${row.id}</td><td>${row.departamento_id}</td><td>${escapeHtml(row.departamento)}</td><td>${escapeHtml(row.municipio)}</td><td>${row.poblacion}</td><td>${row.area_km2}</td><td>${escapeHtml(row.clima)}</td><td>${row.es_capital ? 'Sí' : 'No'}</td></tr>`).join('');
            const createdType = req.query.creado === 'departamento' ? 'Departamento' : req.query.creado === 'municipio' ? 'Municipio' : '';
            const createdId = Number(req.query.id);
            const confirmation = createdType && Number.isInteger(createdId) && createdId > 0
                ? `<p role="status" style="padding: 14px 18px; color: #0d4f32; background: #dcefe3; border-radius: 8px;"><strong>${createdType} guardado correctamente.</strong> ID asignado: ${createdId}.</p>`
                : '';
            const content = `
                <header><div><h1>Registros territoriales</h1><p>Departamentos y municipios almacenados en Colombia DB.</p></div><a href="/">Nuevo registro</a></header>
                ${confirmation}
                <div class="tables">
                    <section class="table-wrap"><h2 class="table-title">Departamentos</h2><table><thead><tr><th>ID</th><th>Nombre</th><th>Región</th><th>Población</th><th>Creación</th><th>Costero</th><th>Presupuesto</th></tr></thead><tbody>${departamentosRows}</tbody></table></section>
                    <section class="table-wrap"><h2 class="table-title">Municipios</h2><table><thead><tr><th>ID</th><th>ID Departamento</th><th>Departamento</th><th>Municipio</th><th>Población</th><th>Área km²</th><th>Clima</th><th>Capital</th></tr></thead><tbody>${municipiosRows}</tbody></table></section>
                </div>`;
            res.send(renderPage(content));
        });
    });
});

app.listen(3000, () => console.log('Servidor web corriendo en puerto 3000'));