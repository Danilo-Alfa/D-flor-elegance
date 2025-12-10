"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Product, ProductColor } from "@/types";
import { ImageFrame } from "@/components/ImageFrame";

export default function AdminPanel() {
  const router = useRouter();
  const { user, logout, products, updateProduct, createProduct, deleteProduct, isLoading } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newColor, setNewColor] = useState({ name: "", hex: "#000000" });
  const [newSize, setNewSize] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user.isAdmin) {
      router.push("/admin/login");
    }
  }, [user.isAdmin, router]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({ ...product });
    setIsEditing(false);
    setSuccessMessage("");
  };

  const handleEditChange = (field: keyof Product, value: string | number | boolean | string[] | ProductColor[] | undefined) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    if (newImageUrl && editForm.images) {
      handleEditChange("images", [...editForm.images, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    if (editForm.images) {
      const newImages = editForm.images.filter((_, i) => i !== index);
      handleEditChange("images", newImages);
      if (index === 0 && newImages.length > 0) {
        handleEditChange("imageUrl", newImages[0]);
      }
    }
  };

  const handleAddColor = () => {
    if (newColor.name && newColor.hex && editForm.colors) {
      handleEditChange("colors", [...editForm.colors, newColor]);
      setNewColor({ name: "", hex: "#000000" });
    }
  };

  const handleRemoveColor = (index: number) => {
    if (editForm.colors) {
      handleEditChange("colors", editForm.colors.filter((_, i) => i !== index));
    }
  };

  const handleAddSize = () => {
    if (newSize && editForm.sizes) {
      handleEditChange("sizes", [...editForm.sizes, newSize]);
      setNewSize("");
    }
  };

  const handleRemoveSize = (index: number) => {
    if (editForm.sizes) {
      handleEditChange("sizes", editForm.sizes.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (selectedProduct && editForm) {
      setIsSaving(true);
      setErrorMessage("");

      try {
        const updatedProduct = {
          ...selectedProduct,
          ...editForm,
          imageUrl: editForm.images?.[0] || selectedProduct.imageUrl,
        } as Product;

        await updateProduct(updatedProduct);
        setSelectedProduct(updatedProduct);
        setIsEditing(false);
        setSuccessMessage("Produto atualizado com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch {
        setErrorMessage("Erro ao salvar produto. Tente novamente.");
        setTimeout(() => setErrorMessage(""), 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddNewProduct = async () => {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const newProductData = {
        name: "Novo Produto",
        description: "Descrição do produto",
        price: 0,
        imageUrl: "",
        images: [],
        sizes: [],
        colors: [],
        category: "Outros",
        stock: 0,
        featured: false,
      };

      await createProduct(newProductData);
      // O produto será adicionado ao state pelo createProduct
      // Selecionar o primeiro produto da lista (o mais recente)
      setSuccessMessage("Produto criado! Edite os detalhes.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Erro ao criar produto. Tente novamente.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct && confirm("Tem certeza que deseja excluir este produto?")) {
      setIsSaving(true);
      setErrorMessage("");

      try {
        await deleteProduct(selectedProduct.id);
        setSelectedProduct(null);
        setEditForm({});
        setSuccessMessage("Produto excluído com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch {
        setErrorMessage("Erro ao excluir produto. Tente novamente.");
        setTimeout(() => setErrorMessage(""), 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="font-display text-xl tracking-wide">
                    D' flor
                  </span>
                  <span className="font-body text-[8px] tracking-[0.3em] uppercase text-[var(--muted)] -mt-1">
                    elegance
                  </span>
                </div>
              </Link>
              <span className="text-[var(--muted)]">/</span>
              <span className="font-semibold">Painel Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/loja"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Ver Loja
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-[var(--secondary)] hover:bg-[var(--border)] rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Products List */}
          <div className="lg:w-1/3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Produtos</h2>
              <button
                onClick={handleAddNewProduct}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? "Criando..." : "+ Novo Produto"}
              </button>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-[var(--muted)]">
                  Carregando produtos...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted)]">
                  Nenhum produto cadastrado
                </div>
              ) : products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selectedProduct?.id === product.id
                      ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                      : "bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--foreground)]"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--secondary)]">
                    {product.imageUrl && (
                      <ImageFrame
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className={`text-sm ${selectedProduct?.id === product.id ? "opacity-70" : "text-[var(--muted)]"}`}>
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Editor */}
          <div className="lg:w-2/3">
            {selectedProduct ? (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {isEditing ? "Editar Produto" : "Detalhes do Produto"}
                  </h2>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          Editar
                        </button>
                        <button
                          onClick={handleDeleteProduct}
                          disabled={isSaving}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isSaving ? "Excluindo..." : "Excluir"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm({ ...selectedProduct });
                          }}
                          className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isSaving ? "Salvando..." : "Salvar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {successMessage && (
                  <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome</label>
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Categoria</label>
                      <input
                        type="text"
                        value={editForm.category || ""}
                        onChange={(e) => handleEditChange("category", e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) => handleEditChange("description", e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] disabled:opacity-50 resize-none"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Preço (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price || 0}
                        onChange={(e) => handleEditChange("price", parseFloat(e.target.value) || 0)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Preço Original (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.originalPrice || ""}
                        onChange={(e) => handleEditChange("originalPrice", parseFloat(e.target.value) || undefined)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] disabled:opacity-50"
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Estoque</label>
                      <input
                        type="number"
                        value={editForm.stock || 0}
                        onChange={(e) => handleEditChange("stock", parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={editForm.featured || false}
                      onChange={(e) => handleEditChange("featured", e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4"
                    />
                    <label htmlFor="featured" className="text-sm font-medium">
                      Produto em Destaque
                    </label>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Imagens (URLs)
                    </label>
                    <p className="text-xs text-[var(--muted)] mb-3">
                      Cole URLs de imagens. A primeira será a imagem principal.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {editForm.images?.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-[var(--secondary)]">
                            <ImageFrame
                              src={img}
                              alt={`Imagem ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          )}
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {isEditing && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="Cole a URL da imagem"
                          className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
                        />
                        <button
                          onClick={handleAddImage}
                          className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--border)] rounded-lg transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sizes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tamanhos</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editForm.sizes?.map((size, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--secondary)] rounded-full text-sm"
                        >
                          {size}
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveSize(index)}
                              className="w-4 h-4 hover:text-red-500"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          placeholder="Ex: P, M, G, GG"
                          className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
                        />
                        <button
                          onClick={handleAddSize}
                          className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--border)] rounded-lg transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Cores</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editForm.colors?.map((color, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--secondary)] rounded-full text-sm"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-[var(--border)]"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveColor(index)}
                              className="w-4 h-4 hover:text-red-500"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newColor.name}
                          onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                          placeholder="Nome da cor"
                          className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
                        />
                        <input
                          type="color"
                          value={newColor.hex}
                          onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                          className="w-12 h-10 rounded-lg border border-[var(--border)] cursor-pointer"
                        />
                        <button
                          onClick={handleAddColor}
                          className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--border)] rounded-lg transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-[var(--muted)] mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p className="text-[var(--muted)]">
                  Selecione um produto para editar ou crie um novo
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
