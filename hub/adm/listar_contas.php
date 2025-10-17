<?php
ob_start();
session_start();
include('../conexao.php');
include_once(__DIR__ . '/includes/header.php');

if (!isset($_SESSION['usuario_doc'])) {
    header("Location: /hub/adm/login.php");
    exit;
}

/* ====== PAGAMENTO ====== */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirmar_pagamento'])) {
    $id = intval($_POST['id_conta']);
    $data_pagamento = date('Y-m-d');
    $caminho_comprovante = '';

    if (!empty($_FILES['comprovante']['name'])) {
        if (!is_dir('comprovantes')) mkdir('comprovantes', 0755, true);
        $nome_arquivo = uniqid() . '_' . basename($_FILES['comprovante']['name']);
        $destino = 'comprovantes/' . $nome_arquivo;
        if (move_uploaded_file($_FILES['comprovante']['tmp_name'], $destino)) {
            $caminho_comprovante = $destino;
        }
    }

    $sql = "UPDATE conta_contas_pagar 
            SET status='pago', data_pagamento=?, caminho_comprovante=? 
            WHERE id=?";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "ssi", $data_pagamento, $caminho_comprovante, $id);
    $ok = mysqli_stmt_execute($stmt);

    $_SESSION['msg'] = $ok ? "✅ Pagamento confirmado com sucesso!" : "❌ Erro ao registrar pagamento.";
    header("Location: listar_contas.php");
    exit;
}

/* ====== CONSULTAS ====== */
$dataHojeSql = date('Y-m-d');
mysqli_query($conn, "UPDATE conta_contas_pagar SET status='vencido' WHERE status='pendente' AND vencimento < '$dataHojeSql'");

$filtro_empresa = $_GET['empresa'] ?? '';
$filtro_status  = $_GET['status']  ?? '';
$data_inicial   = $_GET['data_inicial'] ?? '';
$data_final     = $_GET['data_final']   ?? '';

$sql = "SELECT c.*, e.nome AS empresa_nome
        FROM conta_contas_pagar c
        LEFT JOIN conta_empresas e ON c.id_empresa = e.id
        WHERE 1=1";

if (!empty($filtro_empresa)) $sql .= " AND c.id_empresa = " . intval($filtro_empresa);
if (!empty($filtro_status))  $sql .= " AND c.status = '" . mysqli_real_escape_string($conn, $filtro_status) . "'";
if (!empty($data_inicial))   $sql .= " AND c.vencimento >= '" . mysqli_real_escape_string($conn, $data_inicial) . "'";
if (!empty($data_final))     $sql .= " AND c.vencimento <= '" . mysqli_real_escape_string($conn, $data_final) . "'";
$sql .= " ORDER BY c.vencimento DESC";

$result   = mysqli_query($conn, $sql);
$empresas = mysqli_query($conn, "SELECT id, nome FROM conta_empresas ORDER BY nome");

$qtdVencidas = mysqli_fetch_assoc(
    mysqli_query($conn, "SELECT COUNT(*) AS total FROM conta_contas_pagar WHERE status='vencido'")
)['total'];
?>

<section class="max-w-7xl mx-auto mt-2 bg-white p-6 rounded shadow">
    <!-- 🔷 Título estilizado -->
    <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
        <i data-lucide="wallet" class="w-6 h-6 text-blue-600"></i>
        <h2 class="text-2xl font-bold text-gray-700 tracking-tight">Contas a Pagar</h2>
    </div>

    <?php if ($qtdVencidas > 0): ?>
        <div class="mb-4 bg-red-100 text-red-700 border border-red-400 px-4 py-2 rounded flex items-center gap-2">
            ⚠️ Existem <b><?= $qtdVencidas ?></b> contas vencidas! Verifique os pagamentos pendentes.
        </div>
    <?php endif; ?>

    <?php if (!empty($_SESSION['msg'])): ?>
        <div id="msgSucesso" class="mb-4 bg-green-100 text-green-700 border border-green-400 px-4 py-2 rounded flex items-center gap-2 opacity-100 transition-opacity duration-700">
            <?= htmlspecialchars($_SESSION['msg'], ENT_QUOTES, 'UTF-8'); unset($_SESSION['msg']); ?>
        </div>
    <?php endif; ?>

    <!-- FILTROS -->
    <form method="get" class="flex flex-wrap gap-4 mb-6 items-end">
        <div>
            <label class="block text-sm font-medium text-gray-600">Empresa</label>
            <select name="empresa" class="px-3 py-2 border rounded">
                <option value="">Todas</option>
                <?php while ($e = mysqli_fetch_assoc($empresas)) { ?>
                    <option value="<?= (int) $e['id'] ?>" <?= ($filtro_empresa == $e['id']) ? 'selected' : '' ?>>
                        <?= htmlspecialchars($e['nome'], ENT_QUOTES, 'UTF-8') ?>
                    </option>
                <?php } ?>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-600">Status</label>
            <select name="status" class="px-3 py-2 border rounded">
                <option value="">Todos</option>
                <option value="pendente" <?= ($filtro_status == 'pendente') ? 'selected' : '' ?>>Pendente</option>
                <option value="pago"     <?= ($filtro_status == 'pago') ? 'selected' : '' ?>>Pago</option>
                <option value="vencido"  <?= ($filtro_status == 'vencido') ? 'selected' : '' ?>>Vencido</option>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-600">Data Inicial</label>
            <input type="date" name="data_inicial" value="<?= htmlspecialchars($data_inicial) ?>" class="px-3 py-2 border rounded">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-600">Data Final</label>
            <input type="date" name="data_final" value="<?= htmlspecialchars($data_final) ?>" class="px-3 py-2 border rounded">
        </div>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Filtrar
        </button>
    </form>

    <!-- TABELA -->
    <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-200 text-sm">
            <thead class="bg-gray-100">
                <tr>
                    <th class="py-2 px-3 border-b">Empresa</th>
                    <th class="py-2 px-3 border-b">Fornecedor</th>
                    <th class="py-2 px-3 border-b">Descrição</th>
                    <th class="py-2 px-3 border-b">Valor</th>
                    <th class="py-2 px-3 border-b">Vencimento</th>
                    <th class="py-2 px-3 border-b">Status</th>
                    <th class="py-2 px-3 border-b">Tipo</th>
                    <th class="py-2 px-3 border-b text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($c = mysqli_fetch_assoc($result)) {
                    $statusColor = match($c['status']) {
                        'pago'     => 'text-green-600',
                        'pendente' => 'text-yellow-600',
                        'vencido'  => 'text-red-600',
                        default    => 'text-gray-600'
                    };
                    $tipo = $c['recorrente'] ? '🔁 Recorrente' : 'Manual';
                ?>
                <tr class="hover:bg-gray-50">
                    <td class="py-2 px-3 border-b"><?= htmlspecialchars($c['empresa_nome'], ENT_QUOTES, 'UTF-8') ?></td>
                    <td class="py-2 px-3 border-b"><?= htmlspecialchars($c['fornecedor'], ENT_QUOTES, 'UTF-8') ?></td>
                    <td class="py-2 px-3 border-b"><?= htmlspecialchars($c['descricao'], ENT_QUOTES, 'UTF-8') ?></td>
                    <td class="py-2 px-3 border-b">R$ <?= number_format($c['valor'], 2, ',', '.') ?></td>
                    <td class="py-2 px-3 border-b"><?= date('d/m/Y', strtotime($c['vencimento'])) ?></td>
                    <td class="py-2 px-3 border-b font-semibold <?= $statusColor ?>"><?= ucfirst(htmlspecialchars($c['status'], ENT_QUOTES, 'UTF-8')) ?></td>
                    <td class="py-2 px-3 border-b"><?= $tipo ?></td>
                    <td class="py-2 px-3 border-b text-center align-middle">
                        <div class="flex items-center justify-center gap-2">
                            <a href="editar_conta.php?id=<?= (int) $c['id'] ?>" class="text-blue-600 hover:underline text-sm">Editar</a>

                            <?php if ($c['status'] == 'pago'): ?>
                                <?php if (!empty($c['caminho_comprovante'])): ?>
                                    <button type="button" onclick="abrirModalComprovante(<?= json_encode($c['caminho_comprovante'], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>)" 
                                       class="inline-flex items-center justify-center bg-gray-600 text-white px-4 py-1.5 rounded text-xs hover:bg-gray-700 w-32 text-center">
                                       📄 Visualizar
                                    </button>
                                <?php else: ?>
                                    <span class="inline-flex items-center justify-center bg-gray-400 text-white px-4 py-1.5 rounded text-xs w-32 text-center cursor-not-allowed opacity-70">
                                       📄 Visualizar
                                    </span>
                                <?php endif; ?>
                            <?php else: ?>
                                <button type="button"
                                    onclick="abrirModalPagar(<?= (int) $c['id'] ?>, <?= json_encode($c['fornecedor'], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>, <?= json_encode($c['descricao'], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>, '<?= number_format($c['valor'],2,',','.') ?>', '<?= date('d/m/Y', strtotime($c['vencimento'])) ?>')"
                                    class="inline-flex items-center justify-center bg-green-600 text-white px-4 py-1.5 rounded text-xs hover:bg-green-700 w-32 text-center">
                                    💰 Pagar
                                </button>
                            <?php endif; ?>
                        </div>
                    </td>
                </tr>
                <?php } ?>
            </tbody>
        </table>
    </div>
</section>

<!-- MODAIS -->
<div id="modalPagar" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
  <div class="bg-white rounded-lg shadow-lg w-full max-w-lg p-5">
    <h3 class="text-lg font-semibold mb-4">Confirmar pagamento</h3>
    <form method="post" enctype="multipart/form-data">
      <input type="hidden" name="confirmar_pagamento" value="1">
      <input type="hidden" name="id_conta" id="pg_id_conta">

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm text-gray-600">Fornecedor</label>
          <input type="text" id="pg_fornecedor" class="w-full border rounded px-3 py-2 bg-gray-50" readonly>
        </div>
        <div>
          <label class="block text-sm text-gray-600">Vencimento</label>
          <input type="text" id="pg_vencimento" class="w-full border rounded px-3 py-2 bg-gray-50" readonly>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm text-gray-600">Descrição</label>
          <input type="text" id="pg_descricao" class="w-full border rounded px-3 py-2 bg-gray-50" readonly>
        </div>
        <div>
          <label class="block text-sm text-gray-600">Valor</label>
          <input type="text" id="pg_valor" class="w-full border rounded px-3 py-2 bg-gray-50" readonly>
        </div>
        <div>
          <label class="block text-sm text-gray-600">Comprovante (PDF/Imagem)</label>
          <input type="file" name="comprovante" accept=".pdf,.jpg,.jpeg,.png" class="w-full border rounded px-3 py-2">
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-3">
        <button type="button" onclick="fecharModalPagar()" class="px-4 py-2 rounded border">Cancelar</button>
        <button type="submit" class="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700">Confirmar</button>
      </div>
    </form>
  </div>
</div>

<div id="modalComprovante" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-4 max-w-3xl w-full shadow-lg">
      <h3 class="text-lg font-semibold mb-3">📄 Comprovante</h3>
      <iframe id="iframeComprovante" src="" class="w-full h-[70vh] border rounded"></iframe>
      <div class="text-right mt-3">
          <button onclick="fecharModalComprovante()" class="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">Fechar</button>
      </div>
  </div>
</div>

<script>
lucide.createIcons();

// ===== Fade-out da mensagem =====
const msg = document.getElementById('msgSucesso');
if (msg) {
  setTimeout(() => msg.classList.add('opacity-0'), 2500);
  setTimeout(() => msg.remove(), 3500);
}

// ===== Modal Pagar =====
function abrirModalPagar(id, fornecedor, descricao, valor, vencimento) {
  document.getElementById('pg_id_conta').value   = id;
  document.getElementById('pg_fornecedor').value = fornecedor;
  document.getElementById('pg_descricao').value  = descricao;
  document.getElementById('pg_valor').value      = 'R$ ' + valor;
  document.getElementById('pg_vencimento').value = vencimento;
  document.getElementById('modalPagar').classList.remove('hidden');
}
function fecharModalPagar() {
  document.getElementById('modalPagar').classList.add('hidden');
}

// ===== Modal Comprovante =====
function abrirModalComprovante(caminho) {
  document.getElementById('iframeComprovante').src = caminho;
  document.getElementById('modalComprovante').classList.remove('hidden');
}
function fecharModalComprovante() {
  document.getElementById('modalComprovante').classList.add('hidden');
  document.getElementById('iframeComprovante').src = '';
}

// ===== ESC fecha modais =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharModalPagar();
    fecharModalComprovante();
  }
});
</script>

<?php
include_once(__DIR__ . '/includes/footer.php');
ob_end_flush();
?>
