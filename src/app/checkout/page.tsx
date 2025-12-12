"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { ImageFrame } from "@/components/ImageFrame";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
// PIX usa PagSeguro/PagBank (inline QR Code)

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

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

interface PixData {
  qrCode: string;
  qrCodeImage: string;
  expiresAt: number;
}

// Componente de pagamento PIX
function PixPayment({
  pixData,
  orderNumber,
  total,
  onPaymentConfirmed,
}: {
  pixData: PixData;
  orderNumber: string;
  total: number;
  onPaymentConfirmed: (orderNumber: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((pixData.expiresAt * 1000 - Date.now()) / 1000)),
  );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      console.error("Erro ao copiar");
    }
  };

  // Polling para verificar pagamento a cada 5 segundos (PagSeguro)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        setChecking(true);
        const response = await fetch("/api/webhooks/pagseguro", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber }),
        });
        const data = await response.json();

        if (data.status === "paid") {
          onPaymentConfirmed(orderNumber);
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
      } finally {
        setChecking(false);
      }
    };

    // Verificar imediatamente e depois a cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [orderNumber, onPaymentConfirmed]);

  // Contador regressivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="space-y-6">
      <div className="text-center p-6 bg-secondary rounded-xl">
        <h3 className="text-lg font-bold mb-2">
          Total: R$ {total.toFixed(2).replace(".", ",")}
        </h3>
        <p className="text-sm text-muted">Pedido: {orderNumber}</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-xl">
          <img
            src={pixData.qrCodeImage}
            alt="QR Code PIX"
            className="w-48 h-48"
          />
        </div>

        <p className="text-sm text-muted text-center">
          Escaneie o QR Code acima com o app do seu banco
        </p>

        <div className="w-full">
          <label className="block text-sm font-medium mb-2">
            Ou copie o codigo PIX:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pixData.qrCode}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono truncate"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Status de verificacao */}
        {checking && (
          <div className="flex items-center gap-2 text-muted">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm">Verificando pagamento...</span>
          </div>
        )}

        <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                Expira em {minutes}:{seconds.toString().padStart(2, "0")}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Apos o pagamento, voce sera redirecionado automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, cartTotal, removeFromCart, updateCartQuantity, clearCart } =
    useStore();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [paymentMethodType, setPaymentMethodType] = useState<
    "pix" | "embedded"
  >("embedded");
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  // TODO: Implementar lógica PIX - por enquanto valores fixos para UI
  const pixData: PixData | null = null;
  const pixTotal = 0;
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

  // Preencher dados do usuario logado
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
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">(
    "shipping",
  );

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
  const calculateShipping = useCallback(
    async (cep: string) => {
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
            peso: cart.reduce((acc, item) => acc + item.quantity * 0.3, 0),
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setShippingOptions(data.opcoes);
        if (data.opcoes.length > 0) {
          const cheapest = data.opcoes.reduce(
            (min: ShippingOption, opt: ShippingOption) =>
              opt.preco < min.preco ? opt : min,
          );
          setSelectedShipping(cheapest);
        }
      } catch (err) {
        setShippingError("Erro ao calcular frete. Tente novamente.");
        console.error(err);
      } finally {
        setIsCalculatingShipping(false);
      }
    },
    [cart],
  );

  // Buscar endereco pelo CEP (ViaCEP)
  const fetchAddressByCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
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

  const shippingCost =
    deliveryMethod === "pickup" ? 0 : selectedShipping?.preco || 0;
  const orderTotal = cartTotal + shippingCost;

  const createPaymentIntent = async () => {
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

      if (deliveryMethod === "shipping" && selectedShipping) {
        items.push({
          id: "shipping",
          title: `Frete ${selectedShipping.nome}`,
          quantity: 1,
          unit_price: selectedShipping.preco,
        });
      }

      const phoneNumbers = payerForm.phone.replace(/\D/g, "");

      const cartItems = cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        image_url: item.product.imageUrl,
        quantity: item.quantity,
        price: item.product.price,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor.name,
      }));

      const payerData = {
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
      };

      const shippingData =
        deliveryMethod === "pickup"
          ? {
              method: "Retirada na loja",
              cost: 0,
              deadline: "Retirar em ate 5 dias uteis",
            }
          : selectedShipping
            ? {
                method: selectedShipping.nome,
                cost: selectedShipping.preco,
                deadline: `${selectedShipping.prazo} dias uteis`,
              }
            : null;

      // Escolher endpoint baseado no metodo de pagamento
      // PIX usa PagSeguro/PagBank (QR Code inline)
      // Embedded usa Stripe Checkout
      const apiUrl =
        paymentMethodType === "pix"
          ? "/api/payment/pagseguro"
          : "/api/payment/create-session";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          cartItems,
          paymentMethod: paymentMethodType,
          payer: payerData,
          shipping: shippingData,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (paymentMethodType === "pix") {
        // PagSeguro Checkout - redirecionar para pagina do PagSeguro (apenas PIX)
        if (data.checkoutUrl) {
          setOrderNumber(data.orderNumber);
          // Redirecionar para o checkout do PagSeguro
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error("URL de checkout nao retornada");
        }
      } else {
        setEmbeddedClientSecret(data.clientSecret);
        setOrderNumber(data.orderNumber);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao processar pagamento",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (orderNum: string) => {
    // Confirmar pagamento no banco (fallback para quando webhook nao funciona)
    try {
      await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNum }),
      });
    } catch (err) {
      console.error("Erro ao confirmar pagamento:", err);
    }

    clearCart();
    router.push(`/checkout/success?order=${orderNum}`);
  };

  const isFormValid = () => {
    const basicValid =
      payerForm.name.length > 2 &&
      payerForm.email.includes("@") &&
      payerForm.phone.replace(/\D/g, "").length >= 10;

    if (deliveryMethod === "pickup") {
      return basicValid;
    }

    return (
      basicValid &&
      payerForm.address.street.length > 2 &&
      payerForm.address.number.length > 0 &&
      payerForm.address.city.length > 2 &&
      payerForm.address.state.length === 2 &&
      payerForm.address.zipCode.replace(/\D/g, "").length === 8 &&
      selectedShipping !== null
    );
  };

  if (cart.length === 0 && !orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <svg
            className="w-24 h-24 mx-auto text-muted mb-6"
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
          <h1 className="text-2xl font-bold mb-2">Seu carrinho esta vazio</h1>
          <p className="text-muted mb-6">
            Adicione produtos para continuar com a compra
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="font-display text-xl tracking-wide">
                  D&apos; flor
                </span>
                <span className="font-body text-[8px] tracking-[0.3em] uppercase text-muted -mt-1">
                  elegance
                </span>
              </div>
              <span className="text-muted hidden sm:block">/</span>
              <span className="font-semibold hidden sm:block">Checkout</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Voltar a loja
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-foreground" : "text-muted"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? "bg-foreground text-background" : "bg-secondary"
                }`}
              >
                1
              </span>
              <span className="hidden sm:inline">Carrinho</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-foreground" : "text-muted"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? "bg-foreground text-background" : "bg-secondary"
                }`}
              >
                2
              </span>
              <span className="hidden sm:inline">Dados</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div
              className={`flex items-center gap-2 ${
                step >= 3 ? "text-foreground" : "text-muted"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? "bg-foreground text-background" : "bg-secondary"
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
              <div className="bg-card-bg border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Itens do Carrinho</h2>
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.hex}-${index}`}
                      className="flex gap-4 p-4 bg-background rounded-xl"
                    >
                      <div className="w-24 h-28 rounded-lg overflow-hidden shrink-0">
                        <ImageFrame
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted mt-1">
                          Tamanho: {item.selectedSize} | Cor:{" "}
                          {item.selectedColor.name}
                        </p>
                        <p className="font-bold mt-2">
                          R$ {item.product.price.toFixed(2).replace(".", ",")}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-secondary"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.quantity + 1,
                              )
                            }
                            className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-secondary"
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
                  className="w-full mt-6 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-card-bg border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Dados de Entrega</h2>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={payerForm.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={payerForm.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Telefone *
                      </label>
                      <input
                        type="text"
                        value={payerForm.phone}
                        onChange={(e) =>
                          handleInputChange(
                            "phone",
                            formatPhone(e.target.value),
                          )
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={payerForm.cpf}
                        onChange={(e) =>
                          handleInputChange("cpf", formatCPF(e.target.value))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                  </div>

                  <hr className="border-border my-6" />

                  {/* Metodo de entrega */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                      Como deseja receber?
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          deliveryMethod === "shipping"
                            ? "border-foreground bg-secondary"
                            : "border-border hover:border-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={deliveryMethod === "shipping"}
                          onChange={() => setDeliveryMethod("shipping")}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                              />
                            </svg>
                            <span className="font-medium">Receber em casa</span>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            Entrega via Correios
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          deliveryMethod === "pickup"
                            ? "border-foreground bg-secondary"
                            : "border-border hover:border-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={deliveryMethod === "pickup"}
                          onChange={() => setDeliveryMethod("pickup")}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span className="font-medium">Retirar na loja</span>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            Gratis - Retire em ate 5 dias
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Endereco da loja para retirada */}
                  {deliveryMethod === "pickup" && (
                    <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium text-teal-700 dark:text-teal-300">
                            Endereco para retirada
                          </p>
                          <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                            Rua Exemplo, 123 - Centro
                            <br />
                            Sao Paulo - SP, 01310-100
                            <br />
                            <span className="text-xs">
                              Horario: Seg-Sex 9h as 18h
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CEP com calculo de frete - so mostra se for entrega */}
                  {deliveryMethod === "shipping" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          CEP *
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={payerForm.address.zipCode}
                            onChange={(e) =>
                              handleInputChange(
                                "address.zipCode",
                                formatZipCode(e.target.value),
                              )
                            }
                            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background"
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          <a
                            href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 border border-border rounded-xl text-sm hover:bg-secondary transition-colors whitespace-nowrap text-center"
                          >
                            Nao sei meu CEP
                          </a>
                        </div>
                      </div>

                      {/* Opcoes de Frete */}
                      {payerForm.address.zipCode.replace(/\D/g, "").length ===
                        8 && (
                        <div className="mt-4 p-4 bg-background rounded-xl border border-border">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                              />
                            </svg>
                            Opcoes de Entrega
                          </h3>

                          {isCalculatingShipping ? (
                            <div className="flex items-center gap-2 text-muted">
                              <svg
                                className="w-5 h-5 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                              </svg>
                              Calculando frete...
                            </div>
                          ) : shippingError ? (
                            <p className="text-red-500 text-sm">
                              {shippingError}
                            </p>
                          ) : shippingOptions.length > 0 ? (
                            <div className="space-y-2">
                              {shippingOptions.map((option) => (
                                <label
                                  key={option.codigo}
                                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedShipping?.codigo === option.codigo
                                      ? "border-foreground bg-secondary"
                                      : "border-border hover:border-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="shipping"
                                      checked={
                                        selectedShipping?.codigo ===
                                        option.codigo
                                      }
                                      onChange={() =>
                                        setSelectedShipping(option)
                                      }
                                      className="w-4 h-4"
                                    />
                                    <div>
                                      <p className="font-medium">
                                        {option.nome}
                                      </p>
                                      <p className="text-sm text-muted">
                                        Entrega em ate {option.prazo} dias uteis
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-bold">
                                    R${" "}
                                    {option.preco.toFixed(2).replace(".", ",")}
                                  </span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted text-sm">
                              Digite o CEP para calcular o frete
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {deliveryMethod === "shipping" && (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">
                            Rua *
                          </label>
                          <input
                            type="text"
                            value={payerForm.address.street}
                            onChange={(e) =>
                              handleInputChange(
                                "address.street",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                            placeholder="Nome da rua"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Numero *
                          </label>
                          <input
                            type="text"
                            value={payerForm.address.number}
                            onChange={(e) =>
                              handleInputChange(
                                "address.number",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                            placeholder="123"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Complemento
                          </label>
                          <input
                            type="text"
                            value={payerForm.address.complement}
                            onChange={(e) =>
                              handleInputChange(
                                "address.complement",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                            placeholder="Apto, bloco, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Bairro
                          </label>
                          <input
                            type="text"
                            value={payerForm.address.neighborhood}
                            onChange={(e) =>
                              handleInputChange(
                                "address.neighborhood",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                            placeholder="Bairro"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Cidade *
                          </label>
                          <input
                            type="text"
                            value={payerForm.address.city}
                            onChange={(e) =>
                              handleInputChange("address.city", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                            placeholder="Cidade"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Estado *
                          </label>
                          <input
                            type="text"
                            value={payerForm.address.state}
                            onChange={(e) =>
                              handleInputChange(
                                "address.state",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                            placeholder="SP"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!isFormValid()}
                    className="flex-1 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-card-bg border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Pagamento</h2>

                {/* Resumo dos dados */}
                <div className="mb-6 p-4 bg-background rounded-xl">
                  <h3 className="font-medium mb-2">
                    {deliveryMethod === "pickup"
                      ? "Dados do Cliente"
                      : "Dados de Entrega"}
                  </h3>
                  <p className="text-sm text-muted">
                    {payerForm.name}
                    <br />
                    {payerForm.email}
                    <br />
                    {payerForm.phone}
                  </p>
                  {deliveryMethod === "shipping" && (
                    <p className="text-sm text-muted mt-2">
                      {payerForm.address.street}, {payerForm.address.number}
                      {payerForm.address.complement &&
                        ` - ${payerForm.address.complement}`}
                      <br />
                      {payerForm.address.neighborhood &&
                        `${payerForm.address.neighborhood}, `}
                      {payerForm.address.city} - {payerForm.address.state},{" "}
                      {payerForm.address.zipCode}
                    </p>
                  )}
                  {deliveryMethod === "pickup" ? (
                    <div className="mt-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                      <p className="text-sm text-teal-600 dark:text-teal-400">
                        <strong>Retirada na loja</strong>
                        <br />
                        Rua Exemplo, 123 - Centro
                        <br />
                        Sao Paulo - SP
                        <br />
                        <span className="text-xs">
                          Retire em ate 5 dias uteis
                        </span>
                      </p>
                    </div>
                  ) : (
                    selectedShipping && (
                      <p className="text-sm text-foreground mt-2">
                        <strong>Entrega:</strong> {selectedShipping.nome} - ate{" "}
                        {selectedShipping.prazo} dias uteis
                      </p>
                    )
                  )}
                  <button
                    onClick={() => setStep(2)}
                    className="text-sm text-primary hover:underline mt-2"
                  >
                    Editar dados
                  </button>
                </div>

                {/* Selecao do metodo de pagamento */}
                {!pixData && !embeddedClientSecret && (
                  <>
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">
                        Escolha a forma de pagamento
                      </h3>
                      <div className="grid gap-3">
                        {/* Checkout Rapido - Recomendado */}
                        <label
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            paymentMethodType === "embedded"
                              ? "border-foreground bg-secondary"
                              : "border-border hover:border-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethodType === "embedded"}
                            onChange={() => setPaymentMethodType("embedded")}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="font-medium">
                                Checkout Rapido
                              </span>
                              <span className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Recomendado
                              </span>
                            </div>
                            <p className="text-xs text-muted mt-1">
                              Pagamento rapido e seguro
                            </p>
                          </div>
                        </label>

                        {/* PIX */}
                        <label
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            paymentMethodType === "pix"
                              ? "border-foreground bg-secondary"
                              : "border-border hover:border-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethodType === "pix"}
                            onChange={() => setPaymentMethodType("pix")}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                              </svg>
                              <span className="font-medium">PIX</span>
                              <span className="text-xs bg-teal-500/20 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/30">
                                PagSeguro
                              </span>
                            </div>
                            <p className="text-xs text-muted mt-1">
                              Pagamento instantaneo via QR Code
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-secondary rounded-xl mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span className="font-medium">Pagamento Seguro</span>
                      </div>
                      <p className="text-sm text-muted">
                        Seus dados estao protegidos com criptografia SSL.
                        Processado por Stripe.
                      </p>
                    </div>
                  </>
                )}

                {/* Embedded Checkout */}
                {embeddedClientSecret && paymentMethodType === "embedded" && (
                  <div className="rounded-xl overflow-hidden border border-border">
                    <EmbeddedCheckoutProvider
                      stripe={stripePromise}
                      options={{ clientSecret: embeddedClientSecret }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
                )}

                {/* PIX - QR Code PagSeguro */}
                {pixData && paymentMethodType === "pix" && (
                  <PixPayment
                    pixData={pixData}
                    orderNumber={orderNumber}
                    total={pixTotal}
                    onPaymentConfirmed={handlePaymentSuccess}
                  />
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {!pixData && !embeddedClientSecret && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={createPaymentIntent}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading
                        ? "Processando..."
                        : paymentMethodType === "pix"
                          ? "Pagar com PIX"
                          : "Ir para Pagamento"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card-bg border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.map((item, index) => (
                  <div
                    key={`summary-${item.product.id}-${index}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <ImageFrame
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      R${" "}
                      {(item.product.price * item.quantity)
                        .toFixed(2)
                        .replace(".", ",")}
                    </p>
                  </div>
                ))}
              </div>

              <hr className="border-border my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Frete</span>
                  {deliveryMethod === "pickup" ? (
                    <span className="text-teal-600 dark:text-teal-400 font-medium">
                      Gratis
                    </span>
                  ) : selectedShipping ? (
                    <span>
                      R$ {selectedShipping.preco.toFixed(2).replace(".", ",")}
                    </span>
                  ) : (
                    <span className="text-muted">
                      Calcular no proximo passo
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-border my-4" />

              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold">
                  R$ {orderTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {deliveryMethod === "pickup" ? (
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                  Retirada na loja - Retire em ate 5 dias uteis
                </p>
              ) : (
                selectedShipping && (
                  <p className="text-xs text-muted mt-2">
                    Entrega via {selectedShipping.nome} em ate{" "}
                    {selectedShipping.prazo} dias uteis
                  </p>
                )
              )}

              <p className="text-xs text-muted mt-4 text-center">
                Parcelamento em ate 12x no cartao de credito
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
