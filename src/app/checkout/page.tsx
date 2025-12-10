"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { ImageFrame } from "@/components/ImageFrame";

interface PayerForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface ShippingOption {
  codigo: string;
  nome: string;
  preco: number;
  prazo: number;
}

export default function CheckoutPage() {
  const { cart, cartTotal, removeFromCart, updateCartQuantity } = useStore();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [payerForm, setPayerForm] = useState<PayerForm>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Preencher dados do usuário logado
  useEffect(() => {
    if (user) {
      setPayerForm((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Frete
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.replace("address.", "");
      setPayerForm((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setPayerForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
    }
    return value;
  };

  // Calcular frete quando o CEP estiver completo
  const calculateShipping = useCallback(async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setIsCalculatingShipping(true);
    setShippingError("");

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cepDestino: cepLimpo,
          peso: cart.reduce((acc, item) => acc + (item.quantity * 0.3), 0), // 300g por item
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setShippingOptions(data.opcoes);
      // Seleciona a opção mais barata por padrão
      if (data.opcoes.length > 0) {
        const cheapest = data.opcoes.reduce((min: ShippingOption, opt: ShippingOption) =>
          opt.preco < min.preco ? opt : min
        );
        setSelectedShipping(cheapest);
      }
    } catch (err) {
      setShippingError("Erro ao calcular frete. Tente novamente.");
      console.error(err);
    } finally {
      setIsCalculatingShipping(false);
    }
  }, [cart]);

  // Buscar endereço pelo CEP (ViaCEP)
  const fetchAddressByCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setPayerForm((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro || prev.address.street,
            neighborhood: data.bairro || prev.address.neighborhood,
            city: data.localidade || prev.address.city,
            state: data.uf || prev.address.state,
          },
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    }
  };

  // Efeito para calcular frete quando CEP mudar
  useEffect(() => {
    const cepLimpo = payerForm.address.zipCode.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      calculateShipping(cepLimpo);
      fetchAddressByCep(cepLimpo);
    } else {
      setShippingOptions([]);
      setSelectedShipping(null);
    }
  }, [payerForm.address.zipCode, calculateShipping]);

  const orderTotal = cartTotal + (selectedShipping?.preco || 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsLoading(true);
    setError("");

    try {
      const items = cart.map((item) => ({
        id: item.product.id,
        title: `${item.product.name} - ${item.selectedSize} - ${item.selectedColor.name}`,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      // Adiciona o frete como item
      if (selectedShipping) {
        items.push({
          id: "shipping",
          title: `Frete ${selectedShipping.nome}`,
          quantity: 1,
          unit_price: selectedShipping.preco,
        });
      }

      const phoneNumbers = payerForm.phone.replace(/\D/g, "");

      // Dados do carrinho para salvar no banco
      const cartItems = cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        image_url: item.product.imageUrl,
        quantity: item.quantity,
        price: item.product.price,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor.name,
      }));

      const response = await fetch("/api/payment/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          cartItems,
          payer: {
            name: payerForm.name,
            email: payerForm.email,
            cpf: payerForm.cpf,
            phone: {
              area_code: phoneNumbers.slice(0, 2),
              number: phoneNumbers.slice(2),
            },
            address: {
              street_name: payerForm.address.street,
              street_number: payerForm.address.number,
              complement: payerForm.address.complement,
              neighborhood: payerForm.address.neighborhood,
              city: payerForm.address.city,
              state: payerForm.address.state,
              zip_code: payerForm.address.zipCode.replace(/\D/g, ""),
            },
          },
          shipping: selectedShipping ? {
            method: selectedShipping.nome,
            cost: selectedShipping.preco,
            deadline: `${selectedShipping.prazo} dias úteis`,
          } : null,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Mercado Pago
      const checkoutUrl = data.sandbox_init_point || data.init_point;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("URL de pagamento não disponível");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      payerForm.name.length > 2 &&
      payerForm.email.includes("@") &&
      payerForm.phone.replace(/\D/g, "").length >= 10 &&
      payerForm.address.street.length > 2 &&
      payerForm.address.number.length > 0 &&
      payerForm.address.city.length > 2 &&
      payerForm.address.state.length === 2 &&
      payerForm.address.zipCode.replace(/\D/g, "").length === 8 &&
      selectedShipping !== null
    );
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center">
          <svg
            className="w-24 h-24 mx-auto text-[var(--muted)] mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h1 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
          <p className="text-[var(--muted)] mb-6">
            Adicione produtos para continuar com a compra
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--foreground)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--background)] font-bold text-sm">LR</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">Checkout</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Voltar à loja
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${step >= 1 ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--secondary)]"
                }`}
              >
                1
              </span>
              <span className="hidden sm:inline">Carrinho</span>
            </div>
            <div className="w-12 h-px bg-[var(--border)]" />
            <div
              className={`flex items-center gap-2 ${step >= 2 ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--secondary)]"
                }`}
              >
                2
              </span>
              <span className="hidden sm:inline">Dados</span>
            </div>
            <div className="w-12 h-px bg-[var(--border)]" />
            <div
              className={`flex items-center gap-2 ${step >= 3 ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--secondary)]"
                }`}
              >
                3
              </span>
              <span className="hidden sm:inline">Pagamento</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Itens do Carrinho</h2>
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.hex}-${index}`}
                      className="flex gap-4 p-4 bg-[var(--background)] rounded-xl"
                    >
                      <div className="w-24 h-28 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageFrame
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-[var(--muted)] mt-1">
                          Tamanho: {item.selectedSize} | Cor: {item.selectedColor.name}
                        </p>
                        <p className="font-bold mt-2">
                          R$ {item.product.price.toFixed(2).replace(".", ",")}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))
                            }
                            className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center hover:bg-[var(--secondary)]"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.quantity + 1)
                            }
                            className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center hover:bg-[var(--secondary)]"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-auto text-sm text-red-500 hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Dados de Entrega</h2>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        value={payerForm.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">E-mail *</label>
                      <input
                        type="email"
                        value={payerForm.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Telefone *</label>
                      <input
                        type="text"
                        value={payerForm.phone}
                        onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CPF</label>
                      <input
                        type="text"
                        value={payerForm.cpf}
                        onChange={(e) => handleInputChange("cpf", formatCPF(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                  </div>

                  <hr className="border-[var(--border)] my-6" />

                  {/* CEP com cálculo de frete */}
                  <div>
                    <label className="block text-sm font-medium mb-2">CEP *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={payerForm.address.zipCode}
                        onChange={(e) => handleInputChange("address.zipCode", formatZipCode(e.target.value))}
                        className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      <a
                        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--secondary)] transition-colors whitespace-nowrap"
                      >
                        Não sei meu CEP
                      </a>
                    </div>
                  </div>

                  {/* Opções de Frete */}
                  {payerForm.address.zipCode.replace(/\D/g, "").length === 8 && (
                    <div className="mt-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Opções de Entrega
                      </h3>

                      {isCalculatingShipping ? (
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Calculando frete...
                        </div>
                      ) : shippingError ? (
                        <p className="text-red-500 text-sm">{shippingError}</p>
                      ) : shippingOptions.length > 0 ? (
                        <div className="space-y-2">
                          {shippingOptions.map((option) => (
                            <label
                              key={option.codigo}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedShipping?.codigo === option.codigo
                                  ? "border-[var(--foreground)] bg-[var(--secondary)]"
                                  : "border-[var(--border)] hover:border-[var(--muted)]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="shipping"
                                  checked={selectedShipping?.codigo === option.codigo}
                                  onChange={() => setSelectedShipping(option)}
                                  className="w-4 h-4"
                                />
                                <div>
                                  <p className="font-medium">{option.nome}</p>
                                  <p className="text-sm text-[var(--muted)]">
                                    Entrega em até {option.prazo} dias úteis
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold">
                                R$ {option.preco.toFixed(2).replace(".", ",")}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--muted)] text-sm">
                          Digite o CEP para calcular o frete
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Rua *</label>
                      <input
                        type="text"
                        value={payerForm.address.street}
                        onChange={(e) => handleInputChange("address.street", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="Nome da rua"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Número *</label>
                      <input
                        type="text"
                        value={payerForm.address.number}
                        onChange={(e) => handleInputChange("address.number", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Complemento</label>
                      <input
                        type="text"
                        value={payerForm.address.complement}
                        onChange={(e) => handleInputChange("address.complement", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="Apto, bloco, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bairro</label>
                      <input
                        type="text"
                        value={payerForm.address.neighborhood}
                        onChange={(e) => handleInputChange("address.neighborhood", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="Bairro"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Cidade *</label>
                      <input
                        type="text"
                        value={payerForm.address.city}
                        onChange={(e) => handleInputChange("address.city", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Estado *</label>
                      <input
                        type="text"
                        value={payerForm.address.state}
                        onChange={(e) => handleInputChange("address.state", e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-[var(--border)] rounded-xl font-semibold hover:bg-[var(--secondary)] transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!isFormValid()}
                    className="flex-1 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Pagamento</h2>

                <div className="mb-6 p-4 bg-[var(--background)] rounded-xl">
                  <h3 className="font-medium mb-2">Dados de Entrega</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {payerForm.name}<br />
                    {payerForm.email}<br />
                    {payerForm.address.street}, {payerForm.address.number}
                    {payerForm.address.complement && ` - ${payerForm.address.complement}`}<br />
                    {payerForm.address.neighborhood && `${payerForm.address.neighborhood}, `}
                    {payerForm.address.city} - {payerForm.address.state}, {payerForm.address.zipCode}
                  </p>
                  {selectedShipping && (
                    <p className="text-sm text-[var(--foreground)] mt-2">
                      <strong>Entrega:</strong> {selectedShipping.nome} - até {selectedShipping.prazo} dias úteis
                    </p>
                  )}
                  <button
                    onClick={() => setStep(2)}
                    className="text-sm text-[var(--primary)] hover:underline mt-2"
                  >
                    Editar dados
                  </button>
                </div>

                <div className="p-6 bg-[var(--secondary)] rounded-xl text-center">
                  <img
                    src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png"
                    alt="Mercado Pago"
                    className="h-12 mx-auto mb-4"
                  />
                  <p className="text-sm text-[var(--muted)] mb-4">
                    Ao clicar em &quot;Pagar&quot;, você será redirecionado para o Mercado Pago
                    para finalizar o pagamento de forma segura.
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Aceitamos cartão de crédito, débito, PIX e boleto bancário.
                  </p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 border border-[var(--border)] rounded-xl font-semibold hover:bg-[var(--secondary)] transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Processando..." : `Pagar R$ ${orderTotal.toFixed(2).replace(".", ",")}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.map((item, index) => (
                  <div
                    key={`summary-${item.product.id}-${index}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <ImageFrame
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-[var(--muted)]">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                ))}
              </div>

              <hr className="border-[var(--border)] my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">Frete</span>
                  {selectedShipping ? (
                    <span>R$ {selectedShipping.preco.toFixed(2).replace(".", ",")}</span>
                  ) : (
                    <span className="text-[var(--muted)]">Calcular no próximo passo</span>
                  )}
                </div>
              </div>

              <hr className="border-[var(--border)] my-4" />

              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold">
                  R$ {orderTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {selectedShipping && (
                <p className="text-xs text-[var(--muted)] mt-2">
                  Entrega via {selectedShipping.nome} em até {selectedShipping.prazo} dias úteis
                </p>
              )}

              <p className="text-xs text-[var(--muted)] mt-4 text-center">
                Parcelamento em até 12x no cartão de crédito
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
