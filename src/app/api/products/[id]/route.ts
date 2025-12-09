import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }
      console.error('Erro ao buscar produto:', error);
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

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('products')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }
      console.error('Erro ao atualizar produto:', error);
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

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar produto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
