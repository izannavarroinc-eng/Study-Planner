import { useMutation } from "@tanstack/react-query";
import { GenerateQuizRequest, GenerateQuizResponse } from "@shared/schema";
import { api } from "@shared/routes";
import { nanoid } from "nanoid";

const generateOfflineFallback = (req: GenerateQuizRequest): GenerateQuizResponse => {
  const isTF = req.type === 'true_false';
  
  const questions = Array.from({ length: req.count }).map((_, i) => {
    if (isTF) {
      const isTrue = Math.random() > 0.5;
      return {
        id: nanoid(),
        question: `(Offline) Statement ${i + 1} regarding ${req.topic} is considered to be ${isTrue ? 'true' : 'false'}.`,
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
        explanation: 'Generated via offline template fallback.'
      };
    } else {
      return {
        id: nanoid(),
        question: `(Offline) What is a key concept in ${req.topic} (Question ${i + 1})?`,
        options: ['Concept Alpha', 'Concept Beta', 'Concept Gamma', 'Concept Delta'],
        correctAnswer: 'Concept Alpha',
        explanation: 'Generated via offline template fallback.'
      };
    }
  });

  return { questions };
};

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: async (req: GenerateQuizRequest): Promise<GenerateQuizResponse> => {
      try {
        const validated = api.quiz.generate.input.parse(req);
        const res = await fetch(api.quiz.generate.path, {
          method: api.quiz.generate.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validated),
        });

        if (!res.ok) {
          console.warn(`API returned ${res.status}, falling back to offline mode.`);
          return generateOfflineFallback(req);
        }

        const data = await res.json();
        return api.quiz.generate.responses[200].parse(data);
      } catch (err) {
        console.warn("Quiz generation API failed or is a stub. Falling back to offline mode.", err);
        return generateOfflineFallback(req);
      }
    },
  });
}
