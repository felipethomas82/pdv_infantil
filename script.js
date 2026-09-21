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

let appState = {
  products: [],
  cart: [],
  paymentMethod: 'dinheiro',
  moneyReceived: 0,
  sales: [],
  boxTotals: {
    geral: 0,
    dinheiro: 0,
    pix: 0,
  },
  cashbox: {
    password: '1234',
    totalCash: 0,
    totalPix: 0,
    totalGeneral: 0,
  },
  pixPayloadBase: '',
};

function readDefaultState() {
  if (window.pdvStorage && typeof window.pdvStorage.getDefaultState === 'function') {
    return window.pdvStorage.getDefaultState();
  }

  return {
    products: [
      { id: 'chaveiro', name: 'Chaveiro', price: 1000, icon: 'chaveiro.png', initialStock: 5, stock: 5 },
      { id: 'mandala', name: 'Mandala', price: 1800, icon: 'mandala.png', initialStock: 4, stock: 4 },
      { id: 'borracinha', name: 'Borracinha de Cabelo', price: 1200, icon: 'borrachinha.png', initialStock: 3, stock: 3 },
    ],
    cart: [],
    paymentMethod: 'dinheiro',
    moneyReceived: 0,
    sales: [],
    boxTotals: { geral: 0, dinheiro: 0, pix: 0 },
    cashbox: { password: '1234', totalCash: 0, totalPix: 0, totalGeneral: 0 },
    pixPayloadBase: '00020126580014BR.GOV.BCB.PIX0136fd8ccf4b-42fc-4668-bf63-103022ef8496520400005303986540510.005802BR5920Melissa Souza Thomas6009SAO PAULO62140510dhBlxKOfAk63046C3D',
  };
}

function loadState() {
  if (window.pdvStorage && typeof window.pdvStorage.getState === 'function') {
    appState = window.pdvStorage.getState();
    return;
  }

  const safeDefault = readDefaultState();
  const rawState = localStorage.getItem('pdv_infantil_state');

  if (!rawState) {
    appState = safeDefault;
    return;
  }

  try {
    const parsedState = JSON.parse(rawState);
    appState = {
      ...safeDefault,
      ...parsedState,
      products: Array.isArray(parsedState?.products) && parsedState.products.length ? parsedState.products : safeDefault.products,
      cart: Array.isArray(parsedState?.cart) ? parsedState.cart : [],
      sales: Array.isArray(parsedState?.sales) ? parsedState.sales : [],
      boxTotals: {
        geral: Number(parsedState?.boxTotals?.geral ?? parsedState?.cashbox?.totalGeneral ?? 0),
        dinheiro: Number(parsedState?.boxTotals?.dinheiro ?? parsedState?.cashbox?.totalCash ?? 0),
        pix: Number(parsedState?.boxTotals?.pix ?? parsedState?.cashbox?.totalPix ?? 0),
      },
      cashbox: {
        password: String(parsedState?.cashbox?.password || '1234'),
        totalCash: Number(parsedState?.cashbox?.totalCash ?? 0),
        totalPix: Number(parsedState?.cashbox?.totalPix ?? 0),
        totalGeneral: Number(parsedState?.cashbox?.totalGeneral ?? 0),
      },
      pixPayloadBase: String(parsedState?.pixPayloadBase || safeDefault.pixPayloadBase || ''),
    };
  } catch (error) {
    console.warn('N�o foi poss�vel ler o estado salvo. Resetando.', error);
    appState = safeDefault;
  }
}

function saveState() {
  if (window.pdvStorage && typeof window.pdvStorage.saveCurrentState === 'function') {
    appState = window.pdvStorage.saveCurrentState(appState);
    return;
  }

  localStorage.setItem('pdv_infantil_state', JSON.stringify(appState));
}

function bindEvents() {
  elements.openPaymentBtn.addEventListener('click', () => {
    if (appState.cart.length === 0) {
      return;
    }

    elements.paymentTotalValue.textContent = formatCurrency(getPaymentTotal());
    elements.paymentModal.classList.remove('hidden');
    elements.paymentModal.setAttribute('aria-hidden', 'false');
  });

  elements.closePaymentBtn.addEventListener('click', closePaymentModal);
  elements.paymentModal.addEventListener('click', (event) => {
    if (event.target.dataset.closePayment === 'true') {
      closePaymentModal();
    }
  });

  elements.paymentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      appState.paymentMethod = button.dataset.payment;
      const isCash = appState.paymentMethod === 'dinheiro';

      elements.paymentButtons.forEach((item) => item.classList.toggle('active', item === button));
      elements.moneyPaymentPanel.classList.toggle('hidden', !isCash);
      elements.pixPaymentPanel.classList.toggle('hidden', isCash);
      elements.saleMessage.textContent = '';
      updateTroco();
      renderPixQRCode();
      saveState();
    });
  });

  elements.openCashboxBtn.addEventListener('click', () => {
    renderCashbox();
    elements.cashboxMessage.textContent = '';
    elements.cashboxPasswordInput.value = '';
    elements.cashboxModal.classList.remove('hidden');
    elements.cashboxModal.setAttribute('aria-hidden', 'false');
  });

  elements.closeCashboxBtn.addEventListener('click', () => {
    elements.cashboxModal.classList.add('hidden');
    elements.cashboxModal.setAttribute('aria-hidden', 'true');
  });

  elements.cashboxModal.addEventListener('click', (event) => {
    if (event.target.dataset.closeModal === 'true') {
      elements.cashboxModal.classList.add('hidden');
      elements.cashboxModal.setAttribute('aria-hidden', 'true');
    }
  });

  elements.resetCashboxForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!window.confirm('Deseja iniciar um novo dia e apagar as vendas do caixa?')) {
      return;
    }

    const password = elements.cashboxPasswordInput.value;
    const result = window.pdvStorage?.resetCashbox?.(password);

    if (!result?.reset) {
      elements.cashboxMessage.textContent = 'Senha incorreta.';
      elements.cashboxMessage.classList.add('is-error');
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
    appState.moneyReceived = Number(event.target.value || 0) * 100;
    updateTroco();
    saveState();
  });

  elements.editPaymentAmountBtn.addEventListener('click', () => {
    elements.manualPaymentAmountInput.value = (getPaymentTotal() / 100).toFixed(2);
    elements.paymentAmountModal.classList.remove('hidden');
    elements.paymentAmountModal.setAttribute('aria-hidden', 'false');
    elements.manualPaymentAmountInput.focus();
    elements.manualPaymentAmountInput.select();
  });

  elements.paymentAmountForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Math.round(Number(elements.manualPaymentAmountInput.value) * 100);

    if (!Number.isFinite(amount) || amount < 0) {
      return;
    }

    appState.manualPaymentAmount = amount;
    elements.saleMessage.textContent = '';
    saveState();
    renderCart();
    closePaymentAmountModal();
  });

  elements.closePaymentAmountBtn.addEventListener('click', closePaymentAmountModal);
  elements.cancelPaymentAmountBtn.addEventListener('click', closePaymentAmountModal);
  elements.paymentAmountModal.addEventListener('click', (event) => {
    if (event.target.dataset.closePaymentAmount === 'true') {
      closePaymentAmountModal();
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
    elements.productManagementModal.classList.remove('hidden');
    elements.productManagementModal.setAttribute('aria-hidden', 'false');
  });

  elements.closeProductManagementBtn.addEventListener('click', closeProductManagement);
  elements.productManagementModal.addEventListener('click', (event) => {
    if (event.target.dataset.closeProductManagement === 'true') {
      closeProductManagement();
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
  appState.moneyReceived = total;
  elements.moneyReceivedInput.value = total > 0 ? (total / 100).toFixed(2) : '';
  saveState();
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
  if (window.pdvStorage && typeof window.pdvStorage.addToCart === 'function') {
    appState = window.pdvStorage.addToCart(productId);
  } else {
    const product = appState.products.find((item) => item.id === productId);

    if (!product || product.stock <= 0) {
      return;
    }

    const existingItem = appState.cart.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.qty += 1;
    } else {
      appState.cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }

    product.stock -= 1;
    appState.manualPaymentAmount = null;
    saveState();
  }

  renderCatalog();
  renderCart();
}

function updateCartQuantity(productId, delta) {
  if (window.pdvStorage && typeof window.pdvStorage.updateCartQuantity === 'function') {
    appState = window.pdvStorage.updateCartQuantity(productId, delta);
  } else {
    const product = appState.products.find((item) => item.id === productId);
    const item = appState.cart.find((entry) => entry.id === productId);

    if (!item || !product) {
      return;
    }

    if (delta > 0) {
      if (product.stock <= 0) {
        return;
      }

      item.qty += 1;
      product.stock -= 1;
    } else {
      item.qty -= 1;
      product.stock += 1;

      if (item.qty <= 0) {
        appState.cart = appState.cart.filter((entry) => entry.id !== productId);
      }
    }

    appState.manualPaymentAmount = null;
    saveState();
  }

  renderCatalog();
  renderCart();
}

function clearCart() {
  if (appState.cart.length === 0) {
    return;
  }

  appState.cart.forEach((item) => {
    const product = appState.products.find((entry) => entry.id === item.id);
    if (product) {
      product.stock += item.qty;
    }
  });

  appState.cart = [];
  appState.manualPaymentAmount = null;
  saveState();
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

  if (window.pdvStorage && typeof window.pdvStorage.completeSale === 'function') {
    const result = window.pdvStorage.completeSale();
    appState = result.state;
  } else {
    const paymentMethod = appState.paymentMethod === 'pix' ? 'pix' : 'dinheiro';
    appState.sales.push({
      id: `venda-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: appState.cart.map((item) => ({ ...item })),
      total,
      paymentMethod,
      moneyReceived: paymentMethod === 'dinheiro' ? received : total,
      change: paymentMethod === 'dinheiro' ? received - total : 0,
    });
    appState.boxTotals[paymentMethod] += total;
    appState.boxTotals.geral += total;
    appState.cart = [];
    appState.moneyReceived = 0;
    appState.manualPaymentAmount = null;
    saveState();
  }

  elements.moneyReceivedInput.value = '';
  elements.saleMessage.textContent = 'Venda finalizada com sucesso!';
  elements.saleMessage.classList.add('is-success');
  renderCatalog();
  renderCart();
}

function closePaymentModal() {
  elements.paymentModal.classList.add('hidden');
  elements.paymentModal.setAttribute('aria-hidden', 'true');
}

function closePaymentAmountModal() {
  elements.paymentAmountModal.classList.add('hidden');
  elements.paymentAmountModal.setAttribute('aria-hidden', 'true');
}

function closeProductManagement() {
  elements.productManagementModal.classList.add('hidden');
  elements.productManagementModal.setAttribute('aria-hidden', 'true');
}

function renderCashbox() {
  const totals = appState.boxTotals || {};
  const totalCash = Number(totals.dinheiro ?? appState.cashbox?.totalCash ?? 0);
  const totalPix = Number(totals.pix ?? appState.cashbox?.totalPix ?? 0);
  const totalGeneral = Number(totals.geral ?? appState.cashbox?.totalGeneral ?? totalCash + totalPix);

  elements.modalTotalGeral.textContent = formatCurrency(totalGeneral);
  elements.modalTotalDinheiro.textContent = formatCurrency(totalCash);
  elements.modalTotalPix.textContent = formatCurrency(totalPix);

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
      const price = Math.round(Number(formData.get('price')) * 100);

      if (!Number.isFinite(stock) || stock < 0 || !Number.isFinite(price) || price < 0) {
        return;
      }

      if (window.pdvStorage && typeof window.pdvStorage.updateProduct === 'function') {
        appState = window.pdvStorage.updateProduct(product.id, { stock, price });
      } else {
        product.stock = Math.floor(stock);
        product.price = price;
        appState.cart = appState.cart.map((item) => item.id === product.id ? { ...item, price } : item);
        saveState();
      }

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
  renderCatalog();
  renderCart();

  const paymentButtons = Array.from(elements.paymentButtons);
  const selectedButton = paymentButtons.find((button) => button.dataset.payment === appState.paymentMethod) || paymentButtons[0];

  if (selectedButton) {
    elements.paymentButtons.forEach((button) => button.classList.toggle('active', button === selectedButton));
    const isCash = selectedButton.dataset.payment === 'dinheiro';
    elements.moneyPaymentPanel.classList.toggle('hidden', !isCash);
    elements.pixPaymentPanel.classList.toggle('hidden', isCash);
  }

  elements.moneyReceivedInput.value = appState.moneyReceived ? String(appState.moneyReceived / 100) : '';
}

document.addEventListener('DOMContentLoaded', initializeApp);
