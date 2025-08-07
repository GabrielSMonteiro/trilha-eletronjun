-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  external_link TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for categories (public read)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- RLS Policies for lessons (public read)
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);

-- RLS Policies for questions (public read)
CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert categories
INSERT INTO public.categories (name, display_name, description) VALUES
('software', 'Desenvolvimento de Software', 'Capacitações em programação, desenvolvimento web, mobile e tecnologias'),
('eletronica', 'Eletrônica', 'Capacitações em circuitos, componentes eletrônicos e projetos'),
('lideranca', 'Liderança', 'Desenvolvimento de habilidades de liderança e gestão de equipes'),
('gestao-pessoas', 'Gestão de Pessoas', 'Capacitações em recursos humanos e gestão de talentos'),
('gestao-projetos', 'Gestão de Projetos', 'Metodologias e técnicas de gerenciamento de projetos'),
('mej', 'Movimento Empresa Júnior', 'Capacitações específicas sobre o MEJ e cultura EJ');

-- Insert lessons for Software (10+ lessons)
INSERT INTO public.lessons (category_id, title, description, video_url, order_index) 
SELECT c.id, lesson_data.title, lesson_data.description, lesson_data.video_url, lesson_data.order_index
FROM public.categories c,
(VALUES 
  ('Introdução ao React', 'Fundamentos da biblioteca React', 'https://www.youtube.com/embed/dGcsHMXbSOA', 1),
  ('Components e Props', 'Como criar e usar componentes React', '', 2),
  ('State e Hooks', 'Gerenciamento de estado com hooks', '', 3),
  ('Event Handling', 'Manipulação de eventos em React', '', 4),
  ('Conditional Rendering', 'Renderização condicional de componentes', '', 5),
  ('Lists e Keys', 'Renderização de listas e uso correto de keys', '', 6),
  ('Forms em React', 'Criação e validação de formulários', '', 7),
  ('React Router', 'Navegação entre páginas com React Router', '', 8),
  ('Context API', 'Compartilhamento de estado global', '', 9),
  ('Custom Hooks', 'Criação de hooks personalizados', '', 10),
  ('Performance Optimization', 'Otimização de performance em React', '', 11),
  ('Testing React Apps', 'Testes unitários e de integração', '', 12)
) AS lesson_data(title, description, video_url, order_index)
WHERE c.name = 'software';

-- Insert lessons for Eletrônica (10+ lessons)  
INSERT INTO public.lessons (category_id, title, description, order_index)
SELECT c.id, lesson_data.title, lesson_data.description, lesson_data.order_index
FROM public.categories c,
(VALUES 
  ('Circuitos Básicos', 'Fundamentos de circuitos elétricos', 1),
  ('Lei de Ohm', 'Aplicação da lei de Ohm em circuitos', 2),
  ('Resistores e Capacitores', 'Componentes passivos fundamentais', 3),
  ('Diodos e LEDs', 'Componentes semicondutores básicos', 4),
  ('Transistores', 'Funcionamento e aplicações de transistores', 5),
  ('Amplificadores Operacionais', 'Circuitos com op-amps', 6),
  ('Circuitos Digitais', 'Lógica digital e portas lógicas', 7),
  ('Microcontroladores', 'Programação de microcontroladores', 8),
  ('Sensores e Atuadores', 'Interfaceamento com sensores', 9),
  ('Alimentação e Fontes', 'Projetos de fontes de alimentação', 10),
  ('PCB Design', 'Desenvolvimento de placas de circuito impresso', 11),
  ('Prototipagem', 'Técnicas de prototipagem eletrônica', 12)
) AS lesson_data(title, description, order_index)
WHERE c.name = 'eletronica';

-- Insert lessons for other categories (10+ each)
INSERT INTO public.lessons (category_id, title, description, order_index)
SELECT c.id, lesson_data.title, lesson_data.description, lesson_data.order_index
FROM public.categories c,
(VALUES 
  ('Fundamentos da Liderança', 'Conceitos básicos de liderança', 1),
  ('Comunicação Efetiva', 'Técnicas de comunicação para líderes', 2),
  ('Motivação de Equipes', 'Como motivar e engajar colaboradores', 3),
  ('Tomada de Decisão', 'Processos de decisão estratégica', 4),
  ('Delegação de Tarefas', 'Como delegar eficientemente', 5),
  ('Gestão de Conflitos', 'Resolução de conflitos internos', 6),
  ('Feedback e Coaching', 'Técnicas de feedback construtivo', 7),
  ('Liderança Situacional', 'Adaptação do estilo de liderança', 8),
  ('Desenvolvimento de Talentos', 'Identificação e desenvolvimento de talentos', 9),
  ('Cultura Organizacional', 'Construção de cultura forte', 10),
  ('Liderança em Mudanças', 'Gerenciamento de mudanças organizacionais', 11),
  ('Inteligência Emocional', 'Desenvolvimento da IE na liderança', 12)
) AS lesson_data(title, description, order_index)
WHERE c.name = 'lideranca';

INSERT INTO public.lessons (category_id, title, description, order_index)
SELECT c.id, lesson_data.title, lesson_data.description, lesson_data.order_index
FROM public.categories c,
(VALUES 
  ('Recrutamento e Seleção', 'Processos de contratação eficazes', 1),
  ('Onboarding', 'Integração de novos colaboradores', 2),
  ('Avaliação de Performance', 'Sistemas de avaliação de desempenho', 3),
  ('Planos de Carreira', 'Desenvolvimento de carreiras', 4),
  ('Treinamento e Desenvolvimento', 'Programas de capacitação', 5),
  ('Gestão de Benefícios', 'Administração de benefícios', 6),
  ('Relações Trabalhistas', 'Legislação e relações de trabalho', 7),
  ('Cultura e Clima Organizacional', 'Pesquisas e melhorias do ambiente', 8),
  ('Diversidade e Inclusão', 'Programas de D&I', 9),
  ('Retenção de Talentos', 'Estratégias de retenção', 10),
  ('Sucessão e Planejamento', 'Planejamento sucessório', 11),
  ('Analytics de RH', 'Métricas e indicadores de pessoas', 12)
) AS lesson_data(title, description, order_index)
WHERE c.name = 'gestao-pessoas';

INSERT INTO public.lessons (category_id, title, description, order_index)
SELECT c.id, lesson_data.title, lesson_data.description, lesson_data.order_index
FROM public.categories c,
(VALUES 
  ('Fundamentos de GP', 'Conceitos básicos de gestão de projetos', 1),
  ('Metodologias Ágeis', 'Scrum, Kanban e frameworks ágeis', 2),
  ('Planejamento de Projetos', 'Técnicas de planejamento e cronograma', 3),
  ('Gestão de Riscos', 'Identificação e mitigação de riscos', 4),
  ('Gestão de Recursos', 'Alocação e gestão de recursos', 5),
  ('Comunicação no Projeto', 'Planos de comunicação eficazes', 6),
  ('Controle de Qualidade', 'Garantia da qualidade em projetos', 7),
  ('Gestão de Stakeholders', 'Engajamento de partes interessadas', 8),
  ('Monitoramento e Controle', 'Acompanhamento do progresso', 9),
  ('Encerramento de Projetos', 'Processos de finalização', 10),
  ('PMO e Governança', 'Escritório de projetos e governança', 11),
  ('Ferramentas de GP', 'Software e ferramentas de gestão', 12)
) AS lesson_data(title, description, order_index)
WHERE c.name = 'gestao-projetos';

INSERT INTO public.lessons (category_id, title, description, order_index)
SELECT c.id, lesson_data.title, lesson_data.description, lesson_data.order_index
FROM public.categories c,
(VALUES 
  ('História do MEJ', 'Origem e evolução do movimento', 1),
  ('Conceito EJ', 'O que é uma empresa júnior', 2),
  ('Estrutura Organizacional', 'Como estruturar uma EJ', 3),
  ('Gestão Financeira', 'Controles financeiros em EJs', 4),
  ('Marketing e Vendas', 'Estratégias comerciais para EJs', 5),
  ('Gestão de Projetos', 'GP específica para empresas juniores', 6),
  ('Desenvolvimento Humano', 'Capacitação de membros', 7),
  ('Relações Institucionais', 'Networking e parcerias', 8),
  ('Sucessão e Transição', 'Processos de sucessão em EJs', 9),
  ('Indicadores e Métricas', 'KPIs para empresas juniores', 10),
  ('Inovação em EJs', 'Fomento à inovação no movimento', 11),
  ('Sustentabilidade', 'Práticas sustentáveis em EJs', 12)
) AS lesson_data(title, description, order_index)
WHERE c.name = 'mej';