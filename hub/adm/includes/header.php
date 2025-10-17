<?php
if (!headers_sent()) {
    header('Content-Type: text/html; charset=utf-8');
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hub Administrativo - Contas a Pagar</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-gray-100">
<nav class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <span class="text-lg font-semibold text-gray-700">Hub Administrativo</span>
        <a href="/hub/adm/logout.php" class="text-sm text-blue-600 hover:underline">Sair</a>
    </div>
</nav>
<main class="px-4 py-6">
