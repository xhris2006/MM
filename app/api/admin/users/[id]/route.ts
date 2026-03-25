import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/config'

// ✅ MISE À JOUR (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Correction : Passage en Promise
) {
  try {
    // On attend la résolution de l'ID avant de l'utiliser
    const { id } = await params;

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    // Vérification de l'admin
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { name, category, image_url } = body

    const { data, error } = await supabase
      .from('candidates')
      .update({ 
        name, 
        category, 
        image_url,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Erreur PUT candidate:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

// ✅ SUPPRESSION (DELETE)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // Correction : Passage en Promise
) {
  try {
    const { id } = await params;

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Suppression du candidat
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erreur DELETE candidate:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
