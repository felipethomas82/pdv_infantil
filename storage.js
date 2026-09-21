(function () {
  const STORAGE_KEY = 'pdv_infantil_state';

  const DEFAULT_PRODUCTS = [
    { id: 'chaveiro', name: 'Chaveiro', price: 500, icon: 'chaveiro.png', initialStock: 5, stock: 5 },
    { id: 'mandala', name: 'Mandala', price: 1000, icon: 'mandala.png', initialStock: 4, stock: 4 },
    { id: 'borracinha', name: 'Borracinha de Cabelo', price: 500, icon: 'borrachinha.png', initialStock: 3, stock: 3 },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeProduct(product) {
    const baseProduct = {
      id: String(product?.id || 'produto'),
      name: String(product?.name || 'Produto'),
      price: Number(product?.price || 0),
      icon: String(product?.icon || 'produto.png'),
      initialStock: Number(product?.initialStock ?? product?.stock ?? 0),
      stock: Number(product?.stock ?? product?.initialStock ?? 0),
    };

    return {
      ...baseProduct,
      stock: Number.isFinite(baseProduct.stock) ? baseProduct.stock : 0,
      initialStock: Number.isFinite(baseProduct.initialStock) ? baseProduct.initialStock : 0,
    };
  }

  function getDefaultState() {
    return {
      products: DEFAULT_PRODUCTS.map((product) => normalizeProduct(product)),
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
        password: '1234',
        totalCash: 0,
        totalPix: 0,
        totalGeneral: 0,
      },
      pixPayloadBase: '00020126580014BR.GOV.BCB.PIX0136fd8ccf4b-42fc-4668-bf63-103022ef8496520400005303986540510.005802BR5920Melissa Souza Thomas6009SAO PAULO62140510dhBlxKOfAk63046C3D',
    };
  }

  function normalizeState(state) {
    const baseState = getDefaultState();
    const incoming = state && typeof state === 'object' ? state : {};

    const normalizedProducts = Array.isArray(incoming.products) && incoming.products.length > 0
      ? incoming.products.map((product) => normalizeProduct(product))
      : baseState.products;

    const normalizedCart = Array.isArray(incoming.cart) ? incoming.cart : [];
    const normalizedSales = Array.isArray(incoming.sales) ? incoming.sales : [];
    const normalizedBoxTotals = {
      geral: Number(incoming.boxTotals?.geral ?? incoming.cashbox?.totalGeneral ?? 0),
      dinheiro: Number(incoming.boxTotals?.dinheiro ?? incoming.cashbox?.totalCash ?? 0),
      pix: Number(incoming.boxTotals?.pix ?? incoming.cashbox?.totalPix ?? 0),
    };

    return {
      ...baseState,
      ...incoming,
      products: normalizedProducts,
      cart: normalizedCart,
      sales: normalizedSales,
      manualPaymentAmount: incoming.manualPaymentAmount !== null && incoming.manualPaymentAmount !== undefined && incoming.manualPaymentAmount !== ''
        && Number.isFinite(Number(incoming.manualPaymentAmount)) && Number(incoming.manualPaymentAmount) >= 0
        ? Number(incoming.manualPaymentAmount)
        : null,
      boxTotals: normalizedBoxTotals,
      cashbox: {
        password: String(incoming.cashbox?.password || '1234'),
        totalCash: Number(incoming.cashbox?.totalCash ?? normalizedBoxTotals.dinheiro ?? 0),
        totalPix: Number(incoming.cashbox?.totalPix ?? normalizedBoxTotals.pix ?? 0),
        totalGeneral: Number(incoming.cashbox?.totalGeneral ?? normalizedBoxTotals.geral ?? 0),
      },
      pixPayloadBase: String(incoming.pixPayloadBase || baseState.pixPayloadBase || ''),
    };
  }

  function readLocalStorage() {
    try {
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (!rawState) {
        return getDefaultState();
      }

      const parsed = JSON.parse(rawState);
      return normalizeState(parsed);
    } catch (error) {
      console.warn('Erro ao ler storage local. Resetando para estado padrão.', error);
      return getDefaultState();
    }
  }

  function writeLocalStorage(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
      return true;
    } catch (error) {
      console.error('Não foi possível gravar no localStorage.', error);
      return false;
    }
  }

  function getState() {
    return readLocalStorage();
  }

  function setState(nextState) {
    const normalized = normalizeState(nextState);
    writeLocalStorage(normalized);
    return normalized;
  }

  function resetState() {
    const defaultState = getDefaultState();
    writeLocalStorage(defaultState);
    return defaultState;
  }

  function addToCart(productId) {
    const state = readLocalStorage();
    const product = state.products.find((item) => item.id === productId);

    if (!product || product.stock <= 0) {
      return state;
    }

    const existingItem = state.cart.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      state.cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }

    product.stock -= 1;
    state.manualPaymentAmount = null;
    setState(state);
    return state;
  }

  function updateCartQuantity(productId, delta) {
    const state = readLocalStorage();
    const product = state.products.find((item) => item.id === productId);
    const item = state.cart.find((entry) => entry.id === productId);

    if (!item || !product) {
      return state;
    }

    if (delta > 0) {
      if (product.stock <= 0) {
        return state;
      }
      item.qty += 1;
      product.stock -= 1;
    } else {
      item.qty -= 1;
      product.stock += 1;

      if (item.qty <= 0) {
        state.cart = state.cart.filter((entry) => entry.id !== productId);
      }
    }

    state.manualPaymentAmount = null;
    setState(state);
    return state;
  }

  function completeSale() {
    const state = readLocalStorage();
    const cartTotal = state.cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    const total = state.manualPaymentAmount ?? cartTotal;

    if (!state.cart.length || total <= 0) {
      return { state, sale: null };
    }

    const paymentMethod = state.paymentMethod === 'pix' ? 'pix' : 'dinheiro';
    const sale = {
      id: `venda-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: clone(state.cart),
      total,
      paymentMethod,
      moneyReceived: paymentMethod === 'dinheiro' ? Number(state.moneyReceived || 0) : total,
      change: paymentMethod === 'dinheiro' ? Math.max(Number(state.moneyReceived || 0) - total, 0) : 0,
    };

    state.sales.push(sale);
    state.boxTotals[paymentMethod] += total;
    state.boxTotals.geral += total;
    state.cashbox.totalCash = state.boxTotals.dinheiro;
    state.cashbox.totalPix = state.boxTotals.pix;
    state.cashbox.totalGeneral = state.boxTotals.geral;
    state.cart = [];
    state.moneyReceived = 0;
    state.manualPaymentAmount = null;

    setState(state);
    return { state, sale };
  }

  function saveCurrentState(state) {
    return setState(state);
  }

  function updateProduct(productId, changes) {
    const state = readLocalStorage();
    const product = state.products.find((item) => item.id === productId);

    if (!product) {
      return state;
    }

    const nextStock = Number(changes.stock);
    const nextPrice = Number(changes.price);

    if (Number.isFinite(nextStock) && nextStock >= 0) {
      product.stock = Math.floor(nextStock);
      product.initialStock = Math.max(product.initialStock, product.stock);
    }

    if (Number.isFinite(nextPrice) && nextPrice >= 0) {
      product.price = Math.round(nextPrice);
      state.cart = state.cart.map((item) => item.id === product.id ? { ...item, price: product.price } : item);
    }

    setState(state);
    return state;
  }

  function resetCashbox(password) {
    const state = readLocalStorage();

    if (String(password) !== state.cashbox.password) {
      return { state, reset: false };
    }

    state.products = state.products.map((product) => ({
      ...product,
      stock: product.initialStock,
    }));
    state.cart = [];
    state.sales = [];
    state.paymentMethod = 'dinheiro';
    state.moneyReceived = 0;
    state.manualPaymentAmount = null;
    state.boxTotals = { geral: 0, dinheiro: 0, pix: 0 };
    state.cashbox.totalCash = 0;
    state.cashbox.totalPix = 0;
    state.cashbox.totalGeneral = 0;

    setState(state);
    return { state, reset: true };
  }

  window.pdvStorage = {
    STORAGE_KEY,
    getDefaultState,
    getState,
    setState,
    resetState,
    addToCart,
    updateCartQuantity,
    completeSale,
    updateProduct,
    resetCashbox,
    saveCurrentState,
  };
})();
