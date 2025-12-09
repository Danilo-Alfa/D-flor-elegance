import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Buscar todos os produtos
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformar os dados do Supabase para o formato do frontend
    const products = data.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.original_price,
      imageUrl: product.image_url,
      images: product.images,
      sizes: product.sizes,
      colors: product.colors,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        description: body.description,
        price: body.price,
        original_price: body.originalPrice,
        image_url: body.imageUrl,
        images: body.images,
        sizes: body.sizes,
        colors: body.colors,
        category: body.category,
        stock: body.stock,
        featured: body.featured,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar produto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const product = {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      originalPrice: data.original_price,
      imageUrl: data.image_url,
      images: data.images,
      sizes: data.sizes,
      colors: data.colors,
      category: data.category,
      stock: data.stock,
      featured: data.featured,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
