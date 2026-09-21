const PRODUCT_IMAGE_ALIASES = {
  chaveiro: 'chaveiro.png',
  mandala: 'mandala.png',
  borracinha: 'borrachinha.png',
};

const elements = {
  catalogGrid: document.getElementById('catalogGrid'),
  cartItems: document.getElementById('cartItems'),
  totalValue: document.getElementById('totalValue'),
  openPaymentBtn: document.getElementById('openPaymentBtn'),
  paymentModal: document.getElementById('paymentModal'),
  closePaymentBtn: document.getElementById('closePaymentBtn'),
  paymentTotalValue: document.getElementById('paymentTotalValue'),
  finalizeSaleBtn: document.getElementById('finalizeSaleBtn'),
  moneyReceivedInput: document.getElementById('moneyReceivedInput'),
  changeValue: document.getElementById('changeValue'),
  cashboxModal: document.getElementById('cashboxModal'),
  openCashboxBtn: document.getElementById('openCashboxBtn'),
  closeCashboxBtn: document.getElementById('closeCashboxBtn'),
  modalTotalGeral: document.getElementById('modalTotalGeral'),
  modalTotalDinheiro: document.getElementById('modalTotalDinheiro'),
  modalTotalPix: document.getElementById('modalTotalPix'),
  salesRanking: document.getElementById('salesRanking'),
  salesStatementList: document.getElementById('salesStatementList'),
  resetCashboxForm: document.getElementById('resetCashboxForm'),
  cashboxPasswordInput: document.getElementById('cashboxPasswordInput'),
  cashboxMessage: document.getElementById('cashboxMessage'),
  pixPaymentPanel: document.getElementById('pixPaymentPanel'),
  moneyPaymentPanel: document.getElementById('moneyPaymentPanel'),
  paymentButtons: document.querySelectorAll('.payment-btn'),
  clearCartBtn: document.getElementById('clearCartBtn'),
  pixQRCode: document.getElementById('pixQRCode'),
  pixKeyText: document.getElementById('pixKeyText'),
  paymentValidationMessage: document.getElementById('paymentValidationMessage'),
  saleMessage: document.getElementById('saleMessage'),
  manualPaymentAmountInput: document.getElementById('manualPaymentAmountInput'),
  editPaymentAmountBtn: document.getElementById('editPaymentAmountBtn'),
  paymentAmountModal: document.getElementById('paymentAmountModal'),
  paymentAmountForm: document.getElementById('paymentAmountForm'),
  closePaymentAmountBtn: document.getElementById('closePaymentAmountBtn'),
  cancelPaymentAmountBtn: document.getElementById('cancelPaymentAmountBtn'),
  productManagementModal: document.getElementById('productManagementModal'),
  openProductManagementBtn: document.getElementById('openProductManagementBtn'),
  closeProductManagementBtn: document.getElementById('closeProductManagementBtn'),
  productManagementList: document.getElementById('productManagementList'),
};

// Estado da aplicação: sempre o que o módulo storage.js devolve. Este arquivo
// não mantém cópia própria nem reimplementa leitura, escrita ou mutações.
let appState = {
  products: [],
  cart: [],
  paymentMethod: 'dinheiro',
  moneyReceived: 0,
  manualPaymentAmount: null,
  sales: [],
  boxTotals: {
    geral: 0,
    dinheiro: 0,
    pix: 0,
  },
  cashbox: {
    password: '',
    totalCash: 0,
    totalPix: 0,
    totalGeneral: 0,
  },
  pixPayloadBase: '',
};

// Diálogos modais: um único aberto por vez, com foco e tecla Esc tratados aqui.
const modalState = {
  current: null,
  trigger: null,
};

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'),
  ).filter((element) => !element.disabled && element.offsetParent !== null);
}

function hideModal(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function openModal(modal, options = {}) {
  if (!modal) {
    return;
  }

  const previous = modalState.current;
  const focusOrigin = options.trigger || document.activeElement;
  const cameFromOutsideModal = focusOrigin instanceof HTMLElement
    && !modal.contains(focusOrigin)
    && !(previous && previous.contains(focusOrigin));

  if (previous && previous !== modal) {
    hideModal(previous);
  }

  if (cameFromOutsideModal) {
    modalState.trigger = focusOrigin;
  }

  modalState.current = modal;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  const focusTarget = options.initialFocus || getFocusableElements(modal)[0];

  if (focusTarget) {
    focusTarget.focus();
  }
}

function closeModal(modal) {
  const target = modal || modalState.current;

  if (!target || target.classList.contains('hidden')) {
    return;
  }

  hideModal(target);

  if (modalState.current === target) {
    modalState.current = null;
  }

  const trigger = modalState.trigger;
  modalState.trigger = null;

  if (trigger && document.contains(trigger) && !trigger.closest('.modal')) {
    trigger.focus();
  }
}

function loadState() {
  appState = window.pdvStorage.getState();
}

// Converte o valor digitado pelo operador em centavos, aceitando vírgula ou ponto.
function parseCurrencyInput(value) {
  const normalized = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function bindEvents() {
  elements.openPaymentBtn.addEventListener('click', () => {
    if (appState.cart.length === 0) {
      return;
    }

    elements.paymentTotalValue.textContent = formatCurrency(getPaymentTotal());
    openModal(elements.paymentModal);
  });

  elements.closePaymentBtn.addEventListener('click', () => closeModal(elements.paymentModal));
  elements.paymentModal.addEventListener('click', (event) => {
    if (event.target.dataset.closePayment === 'true') {
      closeModal(elements.paymentModal);
    }
  });

  elements.paymentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      appState = window.pdvStorage.setPaymentMethod(button.dataset.payment);
      elements.saleMessage.textContent = '';
      renderPaymentPanels();
      updateTroco();
      renderPixQRCode();
    });
  });

  elements.openCashboxBtn.addEventListener('click', () => {
    renderCashbox();
    elements.cashboxMessage.textContent = '';
    elements.cashboxPasswordInput.value = '';
    openModal(elements.cashboxModal);
  });

  elements.closeCashboxBtn.addEventListener('click', () => closeModal(elements.cashboxModal));
  elements.cashboxModal.addEventListener('click', (event) => {
    if (event.target.dataset.closeModal === 'true') {
      closeModal(elements.cashboxModal);
    }
  });

  elements.resetCashboxForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!window.confirm('Deseja iniciar um novo dia e apagar as vendas do caixa?')) {
      return;
    }

    const result = window.pdvStorage.resetCashbox(elements.cashboxPasswordInput.value);

    if (!result.reset) {
      elements.cashboxMessage.textContent = 'Senha incorreta.';
      elements.cashboxMessage.classList.add('is-error');
      elements.cashboxMessage.classList.remove('is-success');
      return;
    }

    appState = result.state;
    elements.cashboxPasswordInput.value = '';
    elements.cashboxMessage.textContent = 'Caixa resetado para um novo dia.';
    elements.cashboxMessage.classList.remove('is-error');
    elements.cashboxMessage.classList.add('is-success');
    renderCatalog();
    renderCart();
    renderCashbox();
  });

  elements.moneyReceivedInput.addEventListener('input', (event) => {
    const received = parseCurrencyInput(event.target.value);
    appState = window.pdvStorage.setMoneyReceived(received === null ? 0 : received);
    updateTroco();
  });

  elements.editPaymentAmountBtn.addEventListener('click', () => {
    elements.manualPaymentAmountInput.value = (getPaymentTotal() / 100).toFixed(2);
    openModal(elements.paymentAmountModal, { initialFocus: elements.manualPaymentAmountInput });
    elements.manualPaymentAmountInput.select();
  });

  elements.paymentAmountForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const amount = parseCurrencyInput(elements.manualPaymentAmountInput.value);

    if (amount === null) {
      return;
    }

    appState = window.pdvStorage.setManualPaymentAmount(amount);
    elements.saleMessage.textContent = '';
    elements.paymentTotalValue.textContent = formatCurrency(getPaymentTotal());
    renderCart();
    closeModal(elements.paymentAmountModal);
  });

  elements.closePaymentAmountBtn.addEventListener('click', () => closeModal(elements.paymentAmountModal));
  elements.cancelPaymentAmountBtn.addEventListener('click', () => closeModal(elements.paymentAmountModal));
  elements.paymentAmountModal.addEventListener('click', (event) => {
    if (event.target.dataset.closePaymentAmount === 'true') {
      closeModal(elements.paymentAmountModal);
    }
  });

  elements.clearCartBtn.addEventListener('click', () => {
    clearCart();
  });

  elements.finalizeSaleBtn.addEventListener('click', () => {
    finalizeSale();
  });

  elements.openProductManagementBtn.addEventListener('click', () => {
    renderProductManagement();
    openModal(elements.productManagementModal);
  });

  elements.closeProductManagementBtn.addEventListener('click', () => closeModal(elements.productManagementModal));
  elements.productManagementModal.addEventListener('click', (event) => {
    if (event.target.dataset.closeProductManagement === 'true') {
      closeModal(elements.productManagementModal);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

function resolveProductImage(product) {
  const productId = String(product?.id || '');
  const rawName = product?.icon || PRODUCT_IMAGE_ALIASES[productId] || `${productId}.png`;
  const normalized = String(rawName).toLowerCase();

  if (normalized.endsWith('.png') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp')) {
    return `./photos/${rawName}`;
  }

  return `./photos/${PRODUCT_IMAGE_ALIASES[productId] || `${productId}.png`}`;
}

function formatCurrency(value) {
  const numericValue = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue / 100);
}

function getCartTotal() {
  return appState.cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
}

function getPaymentTotal() {
  return Number.isFinite(appState.manualPaymentAmount) ? appState.manualPaymentAmount : getCartTotal();
}

function prefillMoneyReceived() {
  const total = getPaymentTotal();
  appState = window.pdvStorage.setMoneyReceived(total);
  elements.moneyReceivedInput.value = total > 0 ? (total / 100).toFixed(2).replace('.', ',') : '';
}

function renderCatalog() {
  elements.catalogGrid.innerHTML = '';

  appState.products.forEach((product) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'product-card';
    card.disabled = product.stock <= 0;

    if (product.stock <= 0) {
      card.classList.add('sold-out');
    }

    const imagePath = resolveProductImage(product);

    card.innerHTML = `
      <div class="product-icon">
        <img class="product-image" src="${imagePath}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-name">${product.name}</div>
      <div class="product-price">${formatCurrency(product.price)}</div>
      <div class="product-stock">${product.stock <= 0 ? 'Esgotado' : `Estoque: ${product.stock}`}</div>
    `;

    card.addEventListener('click', () => {
      if (product.stock > 0) {
        addToCart(product.id);
      }
    });

    elements.catalogGrid.appendChild(card);
  });
}

function renderCart() {
  const total = getPaymentTotal();
  elements.totalValue.textContent = formatCurrency(total);
  elements.paymentTotalValue.textContent = formatCurrency(total);

  if (appState.cart.length === 0) {
    elements.cartItems.innerHTML = '<div class="empty-cart">Seu carrinho está vazio.</div>';
    elements.openPaymentBtn.disabled = true;
    elements.finalizeSaleBtn.disabled = true;
    prefillMoneyReceived();
    updateTroco();
    renderPixQRCode();
    return;
  }

  elements.openPaymentBtn.disabled = false;
  prefillMoneyReceived();
  elements.cartItems.innerHTML = '';

  appState.cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <h4>${item.name}</h4>
        <div class="cart-item-meta">
          <span>${formatCurrency(item.price)}</span>
          <strong>${formatCurrency(item.price * item.qty)}</strong>
        </div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" type="button" data-action="decrease" data-product-id="${item.id}" aria-label="Diminuir quantidade de ${item.name}">
          <i class="fa-solid fa-minus" aria-hidden="true"></i>
        </button>
        <span>${item.qty}</span>
        <button class="qty-btn" type="button" data-action="increase" data-product-id="${item.id}" aria-label="Aumentar quantidade de ${item.name}">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
        </button>
      </div>
    `;

    elements.cartItems.appendChild(row);
  });

  elements.cartItems.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const { action, productId } = button.dataset;
      updateCartQuantity(productId, action === 'increase' ? 1 : -1);
    });
  });

  updateTroco();
  renderPixQRCode();
}

function addToCart(productId) {
  appState = window.pdvStorage.addToCart(productId);
  renderCatalog();
  renderCart();
}

function updateCartQuantity(productId, delta) {
  appState = window.pdvStorage.updateCartQuantity(productId, delta);
  renderCatalog();
  renderCart();
}

function clearCart() {
  if (appState.cart.length === 0) {
    return;
  }

  if (!window.confirm('Descartar todos os itens do carrinho e devolver as unidades ao estoque?')) {
    return;
  }

  appState = window.pdvStorage.clearCart();
  renderCatalog();
  renderCart();
}

function updateTroco() {
  const total = getPaymentTotal();
  const received = Number(appState.moneyReceived || 0);

  if (appState.paymentMethod === 'dinheiro') {
    const troco = Math.max(received - total, 0);
    elements.changeValue.textContent = formatCurrency(troco);
    const insufficient = total > 0 && received < total;
    elements.paymentValidationMessage.textContent = insufficient ? 'Valor recebido insuficiente.' : '';
    elements.paymentValidationMessage.classList.toggle('is-error', insufficient);
    elements.finalizeSaleBtn.disabled = total === 0 || insufficient;
  } else {
    elements.changeValue.textContent = formatCurrency(0);
    elements.paymentValidationMessage.textContent = '';
    elements.paymentValidationMessage.classList.remove('is-error');
    elements.finalizeSaleBtn.disabled = total === 0;
  }
}

function calculateCrc16(payload) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function createPixPayload(totalInCents) {
  const source = String(appState.pixPayloadBase || '');
  const crcIndex = source.indexOf('6304');
  let payload = crcIndex >= 0 ? source.slice(0, crcIndex + 4) : source;
  const amount = (totalInCents / 100).toFixed(2);
  const amountTag = `54${String(amount.length).padStart(2, '0')}${amount}`;
  const existingAmount = /54\d{2}\d+\.\d{2}/;

  if (existingAmount.test(payload)) {
    payload = payload.replace(existingAmount, amountTag);
  } else {
    payload = payload.replace('5802BR', `${amountTag}5802BR`);
  }

  return `${payload}${calculateCrc16(payload)}`;
}

function renderPixQRCode() {
  const total = getPaymentTotal();
  elements.pixQRCode.innerHTML = '';

  if (total <= 0 || typeof QRCode !== 'function') {
    elements.pixQRCode.textContent = total > 0 ? 'PIX indisponível' : 'QR';
    elements.pixKeyText.textContent = total > 0 ? 'Não foi possível gerar o QR Code.' : 'PIX para o valor da venda';
    return;
  }

  const payload = createPixPayload(total);
  new QRCode(elements.pixQRCode, {
    text: payload,
    width: 120,
    height: 120,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
  elements.pixKeyText.textContent = `PIX: ${formatCurrency(total)}`;
}

function finalizeSale() {
  const total = getPaymentTotal();
  const received = Number(appState.moneyReceived || 0);

  if (total <= 0 || (appState.paymentMethod === 'dinheiro' && received < total)) {
    updateTroco();
    return;
  }

  const result = window.pdvStorage.completeSale();

  if (!result.sale) {
    updateTroco();
    return;
  }

  appState = result.state;
  elements.moneyReceivedInput.value = '';
  elements.saleMessage.textContent = 'Venda finalizada com sucesso!';
  elements.saleMessage.classList.remove('is-error');
  elements.saleMessage.classList.add('is-success');
  closeModal(elements.paymentModal);
  renderCatalog();
  renderCart();
}

function renderPaymentPanels() {
  const isCash = appState.paymentMethod === 'dinheiro';

  elements.paymentButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.payment === appState.paymentMethod);
  });

  elements.moneyPaymentPanel.classList.toggle('hidden', !isCash);
  elements.pixPaymentPanel.classList.toggle('hidden', isCash);
}

function renderCashbox() {
  const totals = window.pdvStorage.getCashboxTotals(appState);

  elements.modalTotalGeral.textContent = formatCurrency(totals.totalGeneral);
  elements.modalTotalDinheiro.textContent = formatCurrency(totals.totalCash);
  elements.modalTotalPix.textContent = formatCurrency(totals.totalPix);

  const salesByProduct = new Map();
  appState.sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const totalQuantity = salesByProduct.get(item.id)?.qty || 0;
      salesByProduct.set(item.id, { name: item.name, qty: totalQuantity + Number(item.qty || 0) });
    });
  });

  const ranking = Array.from(salesByProduct.values()).sort((first, second) => second.qty - first.qty);
  elements.salesRanking.innerHTML = '';

  if (!ranking.length) {
    elements.salesRanking.innerHTML = '<li>Nenhuma venda registrada ainda.</li>';
    return;
  }

  ranking.forEach((item) => {
    const row = document.createElement('li');
    row.textContent = `${item.name}: ${item.qty} unidade${item.qty === 1 ? '' : 's'}`;
    elements.salesRanking.appendChild(row);
  });

  elements.salesStatementList.innerHTML = '';

  if (!appState.sales.length) {
    elements.salesStatementList.innerHTML = '<p class="empty-statement">Nenhuma venda registrada ainda.</p>';
    return;
  }

  appState.sales.slice().reverse().forEach((sale) => {
    const saleGroup = document.createElement('article');
    saleGroup.className = 'sale-statement-group';
    const soldAt = new Date(sale.timestamp);
    const formattedTimestamp = Number.isNaN(soldAt.getTime())
      ? 'Data não disponível'
      : soldAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const paymentMethod = sale.paymentMethod === 'pix' ? 'PIX' : 'Dinheiro';

    saleGroup.innerHTML = `
      <div class="sale-statement-header">
        <strong>${formattedTimestamp}</strong>
        <span>${paymentMethod}</span>
      </div>
    `;

    sale.items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'sale-statement-item';
      const quantity = Number(item.qty || 0);
      const unitPrice = Number(item.price || 0);
      row.innerHTML = `
        <span>${item.name} (${quantity}x ${formatCurrency(unitPrice)})</span>
        <strong>${formatCurrency(unitPrice * quantity)}</strong>
      `;
      saleGroup.appendChild(row);
    });

    const saleTotal = document.createElement('div');
    saleTotal.className = 'sale-statement-total';
    saleTotal.innerHTML = `<span>Total da venda</span><strong>${formatCurrency(sale.total)}</strong>`;
    saleGroup.appendChild(saleTotal);
    elements.salesStatementList.appendChild(saleGroup);
  });
}

function renderProductManagement() {
  elements.productManagementList.innerHTML = '';

  appState.products.forEach((product) => {
    const row = document.createElement('form');
    row.className = 'product-management-row';
    row.innerHTML = `
      <strong>${product.name}</strong>
      <label>Estoque<input name="stock" type="number" min="0" step="1" value="${product.stock}" /></label>
      <label>Preço<input name="price" type="number" min="0" step="0.01" value="${(product.price / 100).toFixed(2)}" /></label>
      <button class="secondary-btn" type="submit">
        <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
        <span>Salvar</span>
      </button>
    `;

    row.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(row);
      const stock = Number(formData.get('stock'));
      const price = parseCurrencyInput(formData.get('price'));

      if (!Number.isFinite(stock) || stock < 0 || price === null) {
        return;
      }

      appState = window.pdvStorage.updateProduct(product.id, { stock, price });

      renderCatalog();
      renderCart();
      renderProductManagement();
    });

    elements.productManagementList.appendChild(row);
  });
}

function initializeApp() {
  loadState();
  bindEvents();
  renderPaymentPanels();
  renderCatalog();
  renderCart();
  elements.moneyReceivedInput.value = appState.moneyReceived
    ? String(appState.moneyReceived / 100).replace('.', ',')
    : '';
}

document.addEventListener('DOMContentLoaded', initializeApp);
