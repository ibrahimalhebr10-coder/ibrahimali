import { supabase } from '../lib/supabase';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export const messageTemplatesService = {
  async getAllTemplates(): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTemplateById(id: string): Promise<MessageTemplate | null> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createTemplate(template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('message_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('message_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  },

  extractVariables(template: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)];
  }
};
