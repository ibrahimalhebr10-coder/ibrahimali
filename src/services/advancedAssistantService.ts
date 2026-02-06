import { supabase } from '../lib/supabase';

export interface KnowledgeDomain {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface KnowledgeTopic {
  id: string;
  domain_id: string;
  title_ar: string;
  title_en: string;
  summary_ar: string | null;
  summary_en: string | null;
  content_ar: string | null;
  content_en: string | null;
  keywords: string[];
  target_audience: string;
  response_tone: string;
  detail_level: string;
  related_page_url: string | null;
  is_active: boolean;
}

export interface FAQ {
  id: string;
  topic_id: string | null;
  domain_id: string | null;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  question_variations: any;
  intent_tags: string[];
  target_audience: string;
  confidence_threshold: number;
  page_contexts: string[];
  is_active: boolean;
  is_approved: boolean;
}

export interface SensitiveScenario {
  id: string;
  scenario_name: string;
  scenario_name_ar: string;
  trigger_keywords: string[];
  response_template_ar: string;
  response_template_en: string;
  escalation_required: boolean;
  alert_admins: boolean;
  redirect_to_support: boolean;
  priority: string;
  is_active: boolean;
}

export interface IntelligenceMetric {
  id: string;
  metric_date: string;
  total_conversations: number;
  answered_successfully: number;
  unanswered_questions: number;
  avg_confidence_score: number;
  avg_response_time_ms: number;
  satisfaction_rate: number;
  helpfulness_rate: number;
  learning_suggestions_count: number;
  faqs_added: number;
  topics_added: number;
  unique_users: number;
  returning_users: number;
}

export interface ConversationSession {
  id: string;
  user_id: string | null;
  session_fingerprint: string | null;
  user_type: string;
  current_page: string | null;
  user_context: any;
  language: string;
  is_active: boolean;
  started_at: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  intent_detected: string | null;
  confidence_score: number | null;
  matched_faq_id: string | null;
  matched_topic_id: string | null;
  response_time_ms: number | null;
  was_helpful: boolean | null;
  created_at: string;
}

export interface UserContext {
  user_type: 'visitor' | 'authenticated' | 'investor' | 'partner' | 'admin';
  current_page: string;
  previous_pages: string[];
  user_investments?: any;
  user_interests?: any;
}

export interface AssistantResponse {
  answer: string;
  confidence: number;
  matched_faq_id?: string;
  matched_topic_id?: string;
  intent_detected?: string;
  suggested_actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  related_topics?: KnowledgeTopic[];
}

class AdvancedAssistantService {
  async getDomains(): Promise<KnowledgeDomain[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_domains')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching domains:', error);
      return [];
    }
  }

  async getTopicsByDomain(domainId: string): Promise<KnowledgeTopic[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_topics')
        .select('*')
        .eq('domain_id', domainId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
  }

  async searchFAQs(query: string, language: string = 'ar'): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase
        .from('assistant_faqs')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true);

      if (error) throw error;

      if (!data) return [];

      const queryLower = query.toLowerCase();
      const questionField = language === 'ar' ? 'question_ar' : 'question_en';

      const scored = data.map(faq => {
        const question = (faq as any)[questionField].toLowerCase();
        let score = 0;

        if (question.includes(queryLower)) {
          score += 10;
        }

        const queryWords = queryLower.split(' ');
        queryWords.forEach(word => {
          if (question.includes(word)) {
            score += 1;
          }
        });

        return { ...faq, score };
      });

      return scored
        .filter(faq => faq.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Error searching FAQs:', error);
      return [];
    }
  }

  async createSession(context: UserContext, userId?: string): Promise<string | null> {
    try {
      const sessionData: any = {
        user_id: userId || null,
        user_type: context.user_type,
        current_page: context.current_page,
        user_context: context,
        language: 'ar',
        is_active: true
      };

      if (!userId) {
        sessionData.session_fingerprint = this.generateFingerprint();
      }

      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  async addMessage(
    sessionId: string,
    message: string,
    messageType: 'user' | 'assistant' | 'system',
    metadata?: {
      intent?: string;
      confidence?: number;
      matched_faq_id?: string;
      matched_topic_id?: string;
      response_time_ms?: number;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          message_type: messageType,
          content: message,
          intent_detected: metadata?.intent || null,
          confidence_score: metadata?.confidence || null,
          matched_faq_id: metadata?.matched_faq_id || null,
          matched_topic_id: metadata?.matched_topic_id || null,
          response_time_ms: metadata?.response_time_ms || null
        });

      if (error) throw error;

      await supabase
        .from('conversation_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId);

      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  }

  async getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async recordUnansweredQuestion(
    sessionId: string,
    question: string,
    userType: string,
    context: any
  ): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('unanswered_questions')
        .select('id, frequency')
        .eq('question', question)
        .eq('status', 'new')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('unanswered_questions')
          .update({
            frequency: existing.frequency + 1,
            created_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('unanswered_questions')
          .insert({
            session_id: sessionId,
            question,
            user_type: userType,
            user_context: context,
            status: 'new',
            frequency: 1
          });
      }
    } catch (error) {
      console.error('Error recording unanswered question:', error);
    }
  }

  async submitFeedback(
    messageId: string,
    wasHelpful: boolean,
    feedback?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .update({
          was_helpful: wasHelpful,
          user_feedback: feedback || null
        })
        .eq('id', messageId);

      if (error) throw error;

      if (wasHelpful) {
        const { data: message } = await supabase
          .from('conversation_messages')
          .select('matched_faq_id')
          .eq('id', messageId)
          .single();

        if (message?.matched_faq_id) {
          await supabase.rpc('increment', {
            table_name: 'assistant_faqs',
            row_id: message.matched_faq_id,
            column_name: 'helpful_count'
          }).catch(() => {});
        }
      }

      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  async getPageSpecificQuestions(page: string, userType: string): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase
        .from('assistant_faqs')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .or(`target_audience.eq.all,target_audience.eq.${userType}`)
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching page questions:', error);
      return [];
    }
  }

  private generateFingerprint(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const screen = typeof window !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}`
      : '';

    return `${timestamp}-${random}-${userAgent.substring(0, 20)}-${screen}`;
  }

  async askQuestion(
    question: string,
    context: UserContext,
    sessionId?: string
  ): Promise<AssistantResponse> {
    const startTime = Date.now();

    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const userId = await this.getCurrentUserId();
        currentSessionId = await this.createSession(context, userId || undefined);
      }

      if (currentSessionId) {
        await this.addMessage(currentSessionId, question, 'user');
      }

      const userId = await this.getCurrentUserId();
      if (userId) {
        await this.trackUserBehavior(userId, question, context);
      }

      const sensitiveScenario = await this.checkSensitiveScenario(question);
      if (sensitiveScenario) {
        const response: AssistantResponse = {
          answer: sensitiveScenario.response_template_ar,
          confidence: 1,
          intent_detected: sensitiveScenario.scenario_name,
          suggested_actions: sensitiveScenario.redirect_to_support ? [
            {
              label: 'التواصل مع الدعم',
              action: 'contact_support'
            }
          ] : []
        };

        if (currentSessionId) {
          await this.addMessage(
            currentSessionId,
            response.answer,
            'assistant',
            {
              intent: response.intent_detected,
              confidence: response.confidence,
              response_time_ms: Date.now() - startTime
            }
          );
        }

        return response;
      }

      let faqs = await this.getPageSpecificFAQs(context.current_page, context.user_type);

      if (faqs.length === 0) {
        faqs = await this.searchFAQs(question, 'ar');
      }

      if (faqs.length > 0 && faqs[0].score > 3) {
        const bestMatch = faqs[0];
        const response: AssistantResponse = {
          answer: bestMatch.answer_ar,
          confidence: Math.min(faqs[0].score / 10, 1),
          matched_faq_id: bestMatch.id,
          intent_detected: bestMatch.intent_tags[0],
          suggested_actions: this.generateSuggestedActions(bestMatch, context),
          related_topics: []
        };

        if (currentSessionId) {
          const responseTime = Date.now() - startTime;
          await this.addMessage(
            currentSessionId,
            response.answer,
            'assistant',
            {
              intent: response.intent_detected,
              confidence: response.confidence,
              matched_faq_id: response.matched_faq_id,
              response_time_ms: responseTime
            }
          );
        }

        return response;
      }

      if (currentSessionId) {
        await this.recordUnansweredQuestion(
          currentSessionId,
          question,
          context.user_type,
          context
        );
      }

      const fallbackResponse: AssistantResponse = {
        answer: 'عذراً، لم أتمكن من فهم سؤالك بشكل كامل. هل يمكنك إعادة صياغته أو اختيار أحد المواضيع التالية؟',
        confidence: 0,
        suggested_actions: [
          {
            label: 'تصفح الأسئلة الشائعة',
            action: 'browse_faqs'
          },
          {
            label: 'تحدث مع فريق الدعم',
            action: 'contact_support'
          }
        ]
      };

      if (currentSessionId) {
        await this.addMessage(
          currentSessionId,
          fallbackResponse.answer,
          'assistant',
          {
            confidence: 0,
            response_time_ms: Date.now() - startTime
          }
        );
      }

      return fallbackResponse;
    } catch (error) {
      console.error('Error in askQuestion:', error);
      return {
        answer: 'عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.',
        confidence: 0
      };
    }
  }

  private generateSuggestedActions(faq: FAQ, context: UserContext) {
    const actions: Array<{ label: string; action: string; url?: string }> = [];

    if (context.user_type === 'visitor') {
      actions.push({
        label: 'ابدأ الاستثمار الآن',
        action: 'start_investment',
        url: '/agricultural'
      });
    } else if (context.user_type === 'authenticated') {
      actions.push({
        label: 'استكشف الفرص المتاحة',
        action: 'explore_opportunities',
        url: '/agricultural'
      });
    }

    return actions;
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }

  async getSensitiveScenarios(): Promise<SensitiveScenario[]> {
    try {
      const { data, error } = await supabase
        .from('sensitive_scenarios')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sensitive scenarios:', error);
      return [];
    }
  }

  async checkSensitiveScenario(question: string): Promise<SensitiveScenario | null> {
    try {
      const scenarios = await this.getSensitiveScenarios();
      const questionLower = question.toLowerCase();

      for (const scenario of scenarios) {
        for (const keyword of scenario.trigger_keywords) {
          if (questionLower.includes(keyword.toLowerCase())) {
            return scenario;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking sensitive scenario:', error);
      return null;
    }
  }

  async getIntelligenceMetrics(days: number = 7): Promise<IntelligenceMetric[]> {
    try {
      const { data, error } = await supabase
        .from('intelligence_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(days);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching intelligence metrics:', error);
      return [];
    }
  }

  async calculateDailyMetrics(): Promise<void> {
    try {
      const { error } = await supabase.rpc('calculate_daily_intelligence_metrics');
      if (error) throw error;
    } catch (error) {
      console.error('Error calculating daily metrics:', error);
    }
  }

  async getPageSpecificFAQs(page: string, userType: string): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase
        .from('assistant_faqs')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .contains('page_contexts', [page])
        .or(`target_audience.eq.all,target_audience.eq.${userType}`)
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching page FAQs:', error);
      return [];
    }
  }

  async generateQuestionVariations(baseQuestion: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('generate_question_variations', {
          p_base_question: baseQuestion
        });

      if (error) throw error;
      return data || [baseQuestion];
    } catch (error) {
      console.error('Error generating variations:', error);
      return [baseQuestion];
    }
  }

  async logKnowledgeChange(
    changeType: string,
    entityType: string,
    entityId: string,
    changeReason: string,
    oldValue: any = null,
    newValue: any = null
  ): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();

      await supabase
        .from('knowledge_change_log')
        .insert({
          change_type: changeType,
          entity_type: entityType,
          entity_id: entityId,
          changed_by: userId,
          change_reason: changeReason,
          old_value: oldValue,
          new_value: newValue
        });
    } catch (error) {
      console.error('Error logging change:', error);
    }
  }

  async trackUserBehavior(
    userId: string | null,
    question: string,
    context: UserContext
  ): Promise<void> {
    try {
      if (!userId) return;

      const { data: existing } = await supabase
        .from('user_context_tracking')
        .select('previous_questions, engagement_score')
        .eq('user_id', userId)
        .order('tracked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousQuestions = existing?.previous_questions || [];
      const updatedQuestions = [question, ...previousQuestions].slice(0, 5);

      const engagementScore = Math.min(
        100,
        (existing?.engagement_score || 0) + 10
      );

      await supabase
        .from('user_context_tracking')
        .insert({
          user_id: userId,
          current_page: context.current_page,
          previous_pages: context.previous_pages,
          previous_questions: updatedQuestions,
          engagement_score: engagementScore,
          last_interaction_type: 'question',
          actions_taken: context.user_investments || {},
          tracked_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking user behavior:', error);
    }
  }
}

export const advancedAssistantService = new AdvancedAssistantService();
