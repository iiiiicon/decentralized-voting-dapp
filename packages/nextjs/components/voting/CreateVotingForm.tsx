"use client";

import { useState } from "react";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export const CreateVotingForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 60, // 60 минут по умолчанию
  });

  const [candidates, setCandidates] = useState([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);

  const { writeAsync: createVoting, isLoading } = useScaffoldContractWrite({
    contractName: "VotingSystem",
    functionName: "createVoting",
    args: [
      formData.title,
      formData.description,
      candidates.map(c => c.name),
      candidates.map(c => c.description),
      BigInt(formData.duration),
    ],
    onBlockConfirmation: (txnReceipt) => {
      console.log("Voting created:", txnReceipt);
      resetForm();
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title.trim()) {
      alert("Введите название голосования");
      return;
    }

    if (candidates.length < 2) {
      alert("Добавьте хотя бы 2 кандидата");
      return;
    }

    for (let i = 0; i < candidates.length; i++) {
      if (!candidates[i].name.trim()) {
        alert(`Кандидат ${i + 1}: введите имя`);
        return;
      }
    }

    try {
      await createVoting();
    } catch (error) {
      console.error("Error creating voting:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      duration: 60,
    });
    setCandidates([
      { name: "", description: "" },
      { name: "", description: "" },
    ]);
  };

  const addCandidate = () => {
    setCandidates([...candidates, { name: "", description: "" }]);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, field: 'name' | 'description', value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index][field] = value;
    setCandidates(newCandidates);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6">Создать новое голосование</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основные поля */}
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Название голосования*</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Например: Выборы старосты группы"
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Описание</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-32"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Опишите цели и задачи голосования..."
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Длительность (минут)*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10080" // 7 дней
                className="input input-bordered w-full"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 60})}
                required
              />
            </div>
          </div>

          {/* Кандидаты */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Кандидаты* (минимум 2)</h3>
              <button
                type="button"
                onClick={addCandidate}
                className="btn btn-sm btn-outline"
              >
                <PlusIcon className="h-4 w-4" />
                Добавить кандидата
              </button>
            </div>

            <div className="space-y-4">
              {candidates.map((candidate, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  {candidates.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="absolute top-2 right-2 btn btn-sm btn-ghost text-error"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Имя кандидата*</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={candidate.name}
                        onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                        placeholder="Имя кандидата"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="label">
                        <span className="label-text">Описание</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={candidate.description}
                        onChange={(e) => updateCandidate(index, 'description', e.target.value)}
                        placeholder="Краткое описание"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки */}
          <div className="card-actions justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Очистить
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Создание..." : "Создать голосование"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};