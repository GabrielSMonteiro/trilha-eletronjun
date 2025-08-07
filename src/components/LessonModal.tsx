import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, X, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  video_url?: string;
  external_link?: string;
  contentUrl?: string;
  questions?: Question[];
}

interface LessonModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (lessonId: string, passed: boolean) => void;
}

export const LessonModal = ({ lesson, isOpen, onClose, onComplete }: LessonModalProps) => {
  const [currentPhase, setCurrentPhase] = useState<"content" | "quiz">("content");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!lesson) return null;

  const handleStartQuiz = () => {
    setCurrentPhase("quiz");
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    const questions = lesson.questions || [];
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = () => {
    const questions = lesson.questions || [];
    const correctAnswers = selectedAnswers.filter((answer, index) => {
      return answer === questions[index].correctAnswer;
    });
    
    const score = questions.length > 0 ? (correctAnswers.length / questions.length) * 100 : 0;
    const passed = score >= 80;
    
    setShowResults(true);
    
    if (passed) {
      toast({
        title: "Parabéns! 🎉",
        description: `Você acertou ${correctAnswers.length}/${questions.length} questões (${score.toFixed(0)}%)`,
      });
      onComplete(lesson.id, true);
    } else {
      toast({
        title: "Continue tentando! 💪",
        description: `Você acertou ${correctAnswers.length}/${questions.length} questões (${score.toFixed(0)}%). Tente novamente!`,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setCurrentPhase("content");
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    onClose();
  };

  const questions = lesson.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const correctAnswers = selectedAnswers.filter((answer, index) => {
    return answer === questions[index]?.correctAnswer;
  });
  const score = selectedAnswers.length === questions.length 
    ? (correctAnswers.length / questions.length) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-auto bg-card border-2 border-border shadow-strong rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>{lesson.title}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {currentPhase === "content" && (
          <div className="space-y-6">
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              {lesson.videoUrl ? (
                <iframe
                  src={lesson.videoUrl}
                  className="w-full h-full rounded-xl"
                  allowFullScreen
                  title={lesson.title}
                />
              ) : lesson.contentUrl ? (
                <div className="text-center">
                  <ExternalLink className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground mb-4">Conteúdo externo</p>
                  <Button asChild className="bg-gradient-primary">
                    <a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer">
                      Acessar Conteúdo
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Após assistir o conteúdo, responda as {questions.length} questões para continuar
              </p>
              <Button onClick={handleStartQuiz} className="bg-gradient-primary">
                <CheckCircle className="h-4 w-4 mr-2" />
                Iniciar Quiz
              </Button>
            </div>
          </div>
        )}

        {currentPhase === "quiz" && !showResults && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-primary/20">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </Badge>
              <div className="w-32 bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                      className={`w-full text-left justify-start h-auto p-4 ${
                        selectedAnswers[currentQuestionIndex] === index 
                          ? "bg-gradient-primary border-primary/20" 
                          : "border-border hover:border-primary/20"
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="border-border hover:border-primary/20"
              >
                Anterior
              </Button>
              
              <Button 
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="bg-gradient-primary"
              >
                {currentQuestionIndex === questions.length - 1 ? "Finalizar" : "Próxima"}
              </Button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="text-center space-y-6">
            <div className={`p-6 rounded-xl ${score >= 80 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              {score >= 80 ? (
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              ) : (
                <X className="h-16 w-16 mx-auto mb-4 text-red-500" />
              )}
              
              <h3 className="text-2xl font-bold mb-2">
                {score >= 80 ? "Parabéns!" : "Quase lá!"}
              </h3>
              
              <p className="text-lg mb-2">
                Você acertou {correctAnswers.length} de {questions.length} questões
              </p>
              
              <Badge variant={score >= 80 ? "default" : "destructive"} className="text-lg px-4 py-2">
                {score.toFixed(0)}%
              </Badge>
              
              <p className="text-sm text-muted-foreground mt-4">
                {score >= 80 
                  ? "Você pode avançar para a próxima lição!" 
                  : "Você precisa acertar pelo menos 80% para continuar."
                }
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              {score < 80 && (
                <Button 
                  onClick={() => {
                    setCurrentPhase("quiz");
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers([]);
                    setShowResults(false);
                  }}
                  className="bg-gradient-primary"
                >
                  Tentar Novamente
                </Button>
              )}
              
              <Button variant="outline" onClick={handleClose} className="border-border hover:border-primary/20">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};