-- =============================================
-- SQL para criar tabela de pedidos no Supabase
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Tabela de pedidos
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,

  -- Dados do cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_cpf VARCHAR(14),

  -- Endereço de entrega
  shipping_address JSONB NOT NULL,
  -- Formato: { street, number, complement, neighborhood, city, state, zip_code }

  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Frete
  shipping_method VARCHAR(50), -- 'PAC' ou 'SEDEX'
  shipping_deadline VARCHAR(50), -- ex: '5-8 dias úteis'
  tracking_code VARCHAR(50),

  -- Status do pedido
  status VARCHAR(50) DEFAULT 'pending_payment',
  -- pending_payment, paid, preparing, shipped, delivered, cancelled

  -- Integração Mercado Pago
  mercadopago_preference_id VARCHAR(255),
  mercadopago_payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de itens do pedido
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),

  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Variações selecionadas
  selected_size VARCHAR(20),
  selected_color VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_mercadopago_preference_id ON orders(mercadopago_preference_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) para segurança
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir operações via API (service role)
-- IMPORTANTE: Ajuste conforme suas necessidades de segurança

-- Permitir leitura pública para consultas por email (área do cliente)
CREATE POLICY "Permitir leitura de pedidos por email"
  ON orders FOR SELECT
  USING (true);

-- Permitir inserção via API
CREATE POLICY "Permitir inserir pedidos"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Permitir atualização via API
CREATE POLICY "Permitir atualizar pedidos"
  ON orders FOR UPDATE
  USING (true);

-- Políticas para order_items
CREATE POLICY "Permitir leitura de itens"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserir itens"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- =============================================
-- Função para decrementar estoque de produto
-- Usada pelo webhook de pagamento
-- =============================================
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - quantity, 0)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
