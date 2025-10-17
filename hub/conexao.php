<?php
$host = getenv('DB_HOST') ?: 'localhost';
$usuario = getenv('DB_USER') ?: 'usuario';
$senha = getenv('DB_PASSWORD') ?: 'senha';
$database = getenv('DB_NAME') ?: 'database';

$conn = mysqli_connect($host, $usuario, $senha, $database);

if (!$conn) {
    die('Erro ao conectar ao banco de dados: ' . mysqli_connect_error());
}

mysqli_set_charset($conn, 'utf8mb4');
?>
