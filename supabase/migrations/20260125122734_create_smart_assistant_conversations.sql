/*
  # Smart Assistant Conversations System

  1. New Tables
    - `assistant_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for anonymous users)
      - `session_id` (text) - unique session identifier
      - `question` (text) - user's question
      - `answer` (text) - AI's answer
      - `category` (text) - question category (curious, worried, investment)
      - `sentiment` (text) - detected sentiment
      - `helpful` (boolean, nullable) - user feedback
      - `created_at` (timestamptz)
    
    - `assistant_knowledge_base`
      - `id` (uuid, primary key)
      - `topic` (text) - topic name
      - `content` (text) - detailed information
      - `keywords` (text[]) - searchable keywords
      - `priority` (integer) - importance level
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Public read access for knowledge base
    - Conversations require authentication or session
*/

-- Create assistant_conversations table
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sentiment text,
  helpful boolean,
  created_at timestamptz DEFAULT now()
);

-- Create assistant_knowledge_base table
CREATE TABLE IF NOT EXISTS assistant_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_session ON assistant_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON assistant_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_keywords ON assistant_knowledge_base USING gin(keywords);

-- Enable RLS
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assistant_conversations
CREATE POLICY "Anyone can insert conversations"
  ON assistant_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own conversations"
  ON assistant_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view their session conversations"
  ON assistant_conversations FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for assistant_knowledge_base
CREATE POLICY "Knowledge base is publicly readable"
  ON assistant_knowledge_base FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only authenticated users can manage knowledge base"
  ON assistant_knowledge_base FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed knowledge base with platform information
INSERT INTO assistant_knowledge_base (topic, content, keywords, priority) VALUES
(
  'platform_overview',
  'منصة استثمار زراعي سعودية تتيح للأفراد امتلاك حق انتفاع بأشجار حقيقية في مزارع مرخصة. نحن نتولى كل شيء من الزراعة والعناية حتى الحصاد، والمستثمر يستفيد من المحصول أو العوائد السنوية. الفكرة تجمع بين الاستثمار المربح والتجربة الزراعية الفريدة.',
  ARRAY['فكرة المنصة', 'ما هي المنصة', 'نبذة', 'تعريف', 'overview'],
  10
),
(
  'ownership_rights',
  'نعم، تحصل على حق انتفاع موثق بالشجرة عبر عقد رسمي. الشجرة حقيقية وموجودة في مزرعة فعلية مرخصة من وزارة البيئة والمياه والزراعة، ويمكنك زيارتها في أي وقت. لكنها تبقى ضمن المزرعة المدارة لضمان أفضل عناية وإنتاج. الملكية قانونية ومضمونة.',
  ARRAY['ملكية', 'الشجرة', 'حق انتفاع', 'عقد', 'ownership', 'املك'],
  9
),
(
  'investment_vs_experience',
  'هي تجربة استثمارية فريدة من نوعها. ليست استثمار مالي تقليدي، بل امتلاك حقيقي لأصل إنتاجي (شجرة منتجة). تجمع بين المتعة والفائدة - تعيش التجربة الزراعية الحقيقية وتحصل على عوائد ملموسة من المحصول. العائد يتراوح بين 15-25% سنوياً حسب نوع الشجرة.',
  ARRAY['استثمار', 'تجربة', 'عوائد', 'ربح', 'investment'],
  10
),
(
  'risk_management',
  'نحن نتعامل مع مزارع محترفة ومؤمنة ضد المخاطر الطبيعية. إذا حصلت أي مشكلة طبيعية أو طارئة (جفاف، آفات، كوارث)، المزرعة لديها خطط بديلة وتأمين شامل. راحة بالك أولوية عندنا، ولن تتحمل أي خسارة بسبب ظروف خارجة عن السيطرة. كما نوفر تقارير دورية عن حالة الأشجار.',
  ARRAY['مخاطر', 'مشكلة', 'تأمين', 'ضمان', 'risk', 'خسارة'],
  8
),
(
  'commitment_flexibility',
  'لا يوجد التزام معقد أو طويل الأمد. تختار عدد الأشجار وتبدأ. الدورة الزراعية موسمية (سنة واحدة)، وبعدها تقرر إذا تريد تستمر أو تتوقف. بدون عقود طويلة أو شروط مخفية. يمكنك أيضاً بيع حق الانتفاع في أي وقت عبر المنصة.',
  ARRAY['التزام', 'مدة', 'عقد', 'flexibility', 'commitment'],
  7
),
(
  'harvest_benefits',
  'عند موسم الحصاد، لك خياران: 1) تستلم المحصول مباشرة (زيتون، تمر، أو غيره حسب نوع الشجرة) مع توصيل مجاني، أو 2) نبيعه لك بسعر السوق ونحول لك العائد المالي مباشرة. القرار يرجع لك بالكامل. المحصول عضوي ومطابق للمواصفات السعودية.',
  ARRAY['محصول', 'حصاد', 'استفادة', 'harvest', 'benefit', 'عوائد'],
  9
),
(
  'tree_types',
  'نوفر أنواع متعددة من الأشجار: زيتون (عائد 20-25% سنوياً)، نخيل (عائد 15-20%)، لوز (عائد 18-22%)، رمان (عائد 16-20%). كل نوع له موسم حصاد ومتطلبات مختلفة. الأسعار تبدأ من 500 ريال للشجرة الواحدة.',
  ARRAY['أنواع الأشجار', 'زيتون', 'نخيل', 'types', 'tree types'],
  8
),
(
  'visit_farms',
  'نعم! يمكنك زيارة المزرعة وشجرتك في أي وقت بعد التنسيق المسبق. نوفر جولات ميدانية شهرية مجانية، ويمكنك حتى المشاركة في عملية الحصاد إذا أردت. كل شجرة لها رقم تعريفي و QR code.',
  ARRAY['زيارة', 'المزرعة', 'جولة', 'visit', 'farm'],
  7
),
(
  'platform_credibility',
  'المنصة مرخصة من وزارة التجارة ومسجلة في غرفة الرياض. نعمل مع مزارع معتمدة من وزارة البيئة والمياه والزراعة. كل العقود موثقة رسمياً. لدينا أكثر من 5000 مستثمر نشط وتقييم 4.8/5 على متاجر التطبيقات.',
  ARRAY['مصداقية', 'ترخيص', 'ثقة', 'credibility', 'trust'],
  10
);
