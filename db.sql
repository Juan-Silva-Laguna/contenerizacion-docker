CREATE DATABASE IF NOT EXISTS colombia_db;
USE colombia_db;

CREATE TABLE departamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    poblacion INT NOT NULL,
    fecha_creacion DATE NOT NULL,
    es_costero BOOLEAN NOT NULL,
    presupuesto DECIMAL(15, 2) NOT NULL
);

CREATE TABLE municipios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    departamento_id INT,
    nombre VARCHAR(100) NOT NULL,
    poblacion INT NOT NULL,
    area_km2 FLOAT NOT NULL,
    clima VARCHAR(50) NOT NULL,
    es_capital BOOLEAN NOT NULL,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

INSERT INTO departamentos (nombre, region, poblacion, fecha_creacion, es_costero, presupuesto) VALUES
('Huila', 'Andina', 1122622, '1905-04-29', false, 500000.00),
('Cundinamarca', 'Andina', 2919060, '1886-08-05', false, 1500000.00),
('Antioquia', 'Andina', 6677930, '1886-08-05', true, 2000000.00),
('Valle del Cauca', 'Pacífica', 4532152, '1910-04-16', true, 1800000.00);

INSERT INTO municipios (departamento_id, nombre, poblacion, area_km2, clima, es_capital) VALUES
(1, 'Neiva', 357392, 1553, 'Cálido', true),
(1, 'Pitalito', 133205, 653, 'Templado', false),
(1, 'Garzón', 74116, 580, 'Templado', false),
(2, 'Bogotá', 7181469, 1636, 'Frío', true),
(2, 'Soacha', 660159, 184, 'Frío', false),
(2, 'Zipaquirá', 130537, 194, 'Frío', false),
(3, 'Medellín', 2533424, 382, 'Templado', true),
(3, 'Bello', 533973, 142, 'Templado', false),
(3, 'Envigado', 236203, 78, 'Templado', false),
(4, 'Cali', 2252616, 560, 'Cálido', true),
(4, 'Buenaventura', 311727, 6078, 'Cálido', false);