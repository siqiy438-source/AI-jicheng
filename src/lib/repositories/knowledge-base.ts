import { supabase } from '@/lib/supabase';

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  category: string;
  content: string;
  sortOrder: number;
  createdAt: string;
}

export const KNOWLEDGE_CATEGORIES = [
  { value: 'store_basic',       label: '店铺基本信息' },
  { value: 'product_advantage', label: '产品/服务优势' },
  { value: 'store_story',       label: '品牌故事' },
  { value: 'target_customer',   label: '目标客群' },
  { value: 'promotion',         label: '活动/优惠' },
  { value: 'general',           label: '通用备注' },
] as const;

export const getCategoryLabel = (value: string) =>
  KNOWLEDGE_CATEGORIES.find(c => c.value === value)?.label ?? '通用备注';

export const listKnowledgeBase = async (): Promise<KnowledgeBaseItem[]> => {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, title, category, content, sort_order, created_at')
    .order('category')
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
};

export const updateKnowledgeEntry = async (
  id: string,
  input: { title: string; category: string; content: string }
): Promise<void> => {
  const { error } = await supabase
    .from('knowledge_base')
    .update({ title: input.title.trim(), category: input.category, content: input.content.trim() })
    .eq('id', id);
  if (error) throw error;
};

export const deleteKnowledgeEntry = async (id: string): Promise<void> => {
  const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
  if (error) throw error;
};

export const createKnowledgeEntry = async (input: {
  title: string;
  category: string;
  content: string;
}): Promise<KnowledgeBaseItem> => {
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({ title: input.title.trim(), category: input.category, content: input.content.trim() })
    .select('id, title, category, content, sort_order, created_at')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    category: data.category,
    content: data.content,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
  };
};
