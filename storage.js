(function () {
  const STORAGE_KEY = 'pdv_infantil_state';
  const STATE_VERSION = 2;

  // Catálogo canônico: única fonte de produtos, preços e estoques iniciais.
  const DEFAULT_PRODUCTS = [
    { id: 'chaveiro', name: 'Chaveiro', price: 1000, icon: 'chaveiro.png', initialStock: 5 },
    { id: 'mandala', name: 'Mandala', price: 1800, icon: 'mandala.png', initialStock: 4 },
    { id: 'borracinha', name: 'Borracinha de Cabelo', price: 1200, icon: 'borrachinha.png', initialStock: 3 },
  ];

  // Preços da versão 1 do estado (em centavos). Usados apenas para reconhecer
  // um catálogo que ainda está nos valores antigos durante a migração.
  const LEGACY_V1_PRICES = {
    chaveiro: 500,
    mandala: 1000,
    borracinha: 500,
  };

  const DEFAULT_CASHBOX_PASSWORD = '1234';
  const DEFAULT_PIX_PAYLOAD = '00020126580014BR.GOV.BCB.PIX0136fd8ccf4b-42fc-4668-bf63-103022ef8496520400005303986540510.005802BR5920Melissa Souza Thomas6009SAO PAULO62140510dhBlxKOfAk63046C3D';

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
      stateVersion: STATE_VERSION,
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
        password: DEFAULT_CASHBOX_PASSWORD,
      },
      pixPayloadBase: DEFAULT_PIX_PAYLOAD,
    };
  }

  // Totais do caixa são derivados de boxTotals (fonte única) em vez de gravados
  // em paralelo, para não existirem duas cópias do mesmo dado.
  function deriveCashboxTotals(boxTotals) {
    return {
      totalCash: Number(boxTotals?.dinheiro) || 0,
      totalPix: Number(boxTotals?.pix) || 0,
      totalGeneral: Number(boxTotals?.geral) || 0,
    };
  }

  // Lê os totais, aceitando estados antigos que só possuíam cashbox.total*.
  function normalizeBoxTotals(incoming) {
    const boxTotals = incoming?.boxTotals || {};
    const legacyCashbox = incoming?.cashbox || {};

    return {
      geral: Number(boxTotals.geral ?? legacyCashbox.totalGeneral) || 0,
      dinheiro: Number(boxTotals.dinheiro ?? legacyCashbox.totalCash) || 0,
      pix: Number(boxTotals.pix ?? legacyCashbox.totalPix) || 0,
    };
  }

  // Migra o catálogo salvo nos preços da v1 somente quando ele ainda é
  // exatamente o conjunto padrão antigo, para nunca sobrescrever um preço
  // alterado de propósito em "Gerenciar Produtos".
  function migrateLegacyPrices(products) {
    const isLegacyCatalog = DEFAULT_PRODUCTS.every((product) => {
      const saved = products.find((item) => item.id === product.id);
      return Boolean(saved) && Number(saved.price) === LEGACY_V1_PRICES[product.id];
    });

    if (!isLegacyCatalog) {
      return products;
    }

    return products.map((product) => {
      const canonical = DEFAULT_PRODUCTS.find((item) => item.id === product.id);
      return canonical ? { ...product, price: canonical.price } : product;
    });
  }

  function normalizeState(state) {
    const baseState = getDefaultState();
    const incoming = state && typeof state === 'object' ? state : {};

    const hasSavedProducts = Array.isArray(incoming.products) && incoming.products.length > 0;
    let normalizedProducts = hasSavedProducts
      ? incoming.products.map((product) => normalizeProduct(product))
      : baseState.products;

    const savedVersion = Number(incoming.stateVersion);
    const isLegacyState = !Number.isFinite(savedVersion) || savedVersion < STATE_VERSION;

    if (isLegacyState) {
      normalizedProducts = migrateLegacyPrices(normalizedProducts);
    }

    const hasManualPaymentAmount = incoming.manualPaymentAmount !== null
      && incoming.manualPaymentAmount !== undefined
      && incoming.manualPaymentAmount !== ''
      && Number.isFinite(Number(incoming.manualPaymentAmount))
      && Number(incoming.manualPaymentAmount) >= 0;

    return {
      stateVersion: STATE_VERSION,
      products: normalizedProducts,
      cart: Array.isArray(incoming.cart) ? incoming.cart : [],
      paymentMethod: incoming.paymentMethod === 'pix' ? 'pix' : 'dinheiro',
      moneyReceived: Number(incoming.moneyReceived) || 0,
      manualPaymentAmount: hasManualPaymentAmount ? Number(incoming.manualPaymentAmount) : null,
      sales: Array.isArray(incoming.sales) ? incoming.sales : [],
      boxTotals: normalizeBoxTotals(incoming),
      cashbox: {
        password: String(incoming.cashbox?.password || DEFAULT_CASHBOX_PASSWORD),
      },
      pixPayloadBase: String(incoming.pixPayloadBase || baseState.pixPayloadBase),
    };
  }

  // Estado entregue aos consumidores: acrescenta os totais derivados do caixa,
  // que nunca são persistidos, para não recriar a cópia paralela.
  function withDerivedCashbox(state) {
    return {
      ...state,
      cashbox: {
        password: state.cashbox.password,
        ...deriveCashboxTotals(state.boxTotals),
      },
    };
  }

  // Estado mantido em memória quando o localStorage não está disponível
  // (modo privado, cota cheia), para o app continuar operável na sessão.
  let memoryState = null;

  function readPersistedState() {
    if (memoryState) {
      return memoryState;
    }

    try {
      const rawState = localStorage.getItem(STORAGE_KEY);
      return rawState ? JSON.parse(rawState) : null;
    } catch (error) {
      console.warn('Não foi possível ler o estado salvo no navegador. Usando o estado padrão.', error);
      return null;
    }
  }

  function writePersistedState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      memoryState = null;
      return true;
    } catch (error) {
      memoryState = state;
      console.warn('Não foi possível gravar no armazenamento do navegador. O estado será mantido apenas nesta sessão.', error);
      return false;
    }
  }

  function readState() {
    const persisted = readPersistedState();
    return persisted ? normalizeState(persisted) : getDefaultState();
  }

  function writeState(state) {
    const normalized = normalizeState(state);
    writePersistedState(normalized);
    return normalized;
  }

  function getState() {
    return withDerivedCashbox(readState());
  }

  function setState(nextState) {
    return withDerivedCashbox(writeState(nextState));
  }

  function resetState() {
    return setState(getDefaultState());
  }

  function addToCart(productId) {
    const state = readState();
    const product = state.products.find((item) => item.id === productId);

    if (!product || product.stock <= 0) {
      return withDerivedCashbox(state);
    }

    const existingItem = state.cart.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      state.cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }

    product.stock -= 1;
    state.manualPaymentAmount = null;
    return withDerivedCashbox(writeState(state));
  }

  function updateCartQuantity(productId, delta) {
    const state = readState();
    const product = state.products.find((item) => item.id === productId);
    const item = state.cart.find((entry) => entry.id === productId);

    if (!item || !product) {
      return withDerivedCashbox(state);
    }

    if (delta > 0) {
      if (product.stock <= 0) {
        return withDerivedCashbox(state);
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
    return withDerivedCashbox(writeState(state));
  }

  // Descartar o carrinho devolve ao estoque as unidades reservadas.
  function clearCart() {
    const state = readState();

    state.cart.forEach((item) => {
      const product = state.products.find((entry) => entry.id === item.id);

      if (product) {
        product.stock += Number(item.qty) || 0;
      }
    });

    state.cart = [];
    state.manualPaymentAmount = null;
    return withDerivedCashbox(writeState(state));
  }

  function setPaymentMethod(method) {
    const state = readState();
    state.paymentMethod = method === 'pix' ? 'pix' : 'dinheiro';
    return withDerivedCashbox(writeState(state));
  }

  function setMoneyReceived(cents) {
    const state = readState();
    const value = Number(cents) || 0;

    if (state.moneyReceived === value) {
      return withDerivedCashbox(state);
    }

    state.moneyReceived = value;
    return withDerivedCashbox(writeState(state));
  }

  function setManualPaymentAmount(cents) {
    const state = readState();
    const isEmpty = cents === null || cents === undefined || cents === '';
    const value = isEmpty ? null : Number(cents);

    if (!isEmpty && (!Number.isFinite(value) || value < 0)) {
      return withDerivedCashbox(state);
    }

    state.manualPaymentAmount = value;
    return withDerivedCashbox(writeState(state));
  }

  function completeSale() {
    const state = readState();
    const cartTotal = state.cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    const total = state.manualPaymentAmount ?? cartTotal;

    if (!state.cart.length || total <= 0) {
      return { state: withDerivedCashbox(state), sale: null };
    }

    const paymentMethod = state.paymentMethod === 'pix' ? 'pix' : 'dinheiro';
    const moneyReceived = paymentMethod === 'dinheiro' ? Number(state.moneyReceived || 0) : total;

    if (paymentMethod === 'dinheiro' && moneyReceived < total) {
      return { state: withDerivedCashbox(state), sale: null };
    }

    const sale = {
      id: `venda-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: clone(state.cart),
      total,
      paymentMethod,
      moneyReceived,
      change: paymentMethod === 'dinheiro' ? Math.max(moneyReceived - total, 0) : 0,
    };

    state.sales.push(sale);
    state.boxTotals[paymentMethod] += total;
    state.boxTotals.geral += total;
    state.cart = [];
    state.moneyReceived = 0;
    state.manualPaymentAmount = null;

    return { state: withDerivedCashbox(writeState(state)), sale };
  }

  function updateProduct(productId, changes) {
    const state = readState();
    const product = state.products.find((item) => item.id === productId);

    if (!product) {
      return withDerivedCashbox(state);
    }

    const nextStock = Number(changes.stock);
    const nextPrice = Number(changes.price);
    const nextInitialStock = Number(changes.initialStock);

    if (changes.stock !== undefined && Number.isFinite(nextStock) && nextStock >= 0) {
      product.stock = Math.floor(nextStock);
    }

    // initialStock é o baseline do "Novo Dia": só muda quando informado
    // explicitamente, nunca como efeito de uma alteração de estoque.
    if (changes.initialStock !== undefined && Number.isFinite(nextInitialStock) && nextInitialStock >= 0) {
      product.initialStock = Math.floor(nextInitialStock);
    }

    if (changes.price !== undefined && Number.isFinite(nextPrice) && nextPrice >= 0) {
      product.price = Math.round(nextPrice);
      state.cart = state.cart.map((item) => item.id === product.id ? { ...item, price: product.price } : item);
    }

    return withDerivedCashbox(writeState(state));
  }

  function resetCashbox(password) {
    const state = readState();

    if (String(password) !== state.cashbox.password) {
      return { state: withDerivedCashbox(state), reset: false };
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

    return { state: withDerivedCashbox(writeState(state)), reset: true };
  }

  function getCashboxTotals(state) {
    return deriveCashboxTotals((state || readState()).boxTotals);
  }

  window.pdvStorage = {
    STORAGE_KEY,
    getDefaultState,
    getState,
    setState,
    resetState,
    addToCart,
    updateCartQuantity,
    clearCart,
    setPaymentMethod,
    setMoneyReceived,
    setManualPaymentAmount,
    completeSale,
    updateProduct,
    resetCashbox,
    getCashboxTotals,
  };
})();
