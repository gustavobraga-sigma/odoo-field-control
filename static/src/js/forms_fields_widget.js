/** @odoo-module **/

import { Component, useState, onWillStart, onMounted, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";


export class FormsFieldsWidget extends Component {
    static props = {
        value: { type: Array, optional: true },
        readonly: { type: Boolean, optional: true },
        id: { type: [Number, String, null], optional: true },
        name: { type: String, optional: true },
        record: { type: Object, optional: true },
    };

    setup() {
        this.canvasRef = useRef("canvas");
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        this.sign_signature = "";
        this.orm = useService("orm");
        this.state = useState({
            startForms: [],
            endForms: [],
            answers: {},
            prevAnswers: {},
            editingSignature: {}, // Estado para controlar edição de assinaturas
            isTaskDone: false,
        });

        // Vincula explicitamente o método ao contexto do componente
        this.enableSignatureEdit = this.enableSignatureEdit.bind(this);

        // Outros métodos vinculados, se necessário
        this.loadCanvas = this.loadCanvas.bind(this);
        this.openImageModal = this.openImageModal.bind(this);
        this.closeImageModal = this.closeImageModal.bind(this);

        this.formQuestions = useState({
            startQuestions: [],
            endQuestions: []
        })
        this.answeredMap = useState({});
        // Bind         explícito para garantir o this correto
        this.openImageModal = this.openImageModal.bind(this);
        this.closeImageModal = this.closeImageModal.bind(this);


        // Bind explícito para garantir o this correto
        this.openImageModal = this.openImageModal.bind(this);
        this.closeImageModal = this.closeImageModal.bind(this);


        onWillStart(async () => {

            const taskId = this.props.record.resId;
            const task = await this.orm.read("project.task", [taskId], ["state"]);
            this.state.isTaskDone = task[0].state === '1_done';

            const activityFieldId = this.props.record?.data?.activity_field_id?.[0];
            if (activityFieldId) {
                const result = await this.orm.read(
                    "activity.types.field",
                    [activityFieldId],
                    ["start_form_ids", "end_form_ids", "name"]
                );

                if (result && result.length) {
                    const activity = result[0];

                    // Carregar formulários de início
                    const startForms = await this.orm.read(
                        "type.forms",
                        activity.start_form_ids,
                        ["name", "id", "question_ids"]
                    );

                    // Carregar perguntas dos formulários de início
                    const startFormsWithQuestions = [];
                    for (const form of startForms) {
                        let questions = [];
                        if (form.question_ids.length) {
                            questions = await this.orm.read(
                                "question.fields",
                                form.question_ids,
                                ["id", "required", "name", "type_form", "options_ids"]
                            );
                        }

                        // Agora para cada pergunta, buscamos as opções associadas
                        for (let question of questions) {
                            // Se a pergunta tiver opções, busque as opções associadas
                            if (question.options_ids.length) {
                                const options = await this.orm.read(
                                    "question.field.option",
                                    question.options_ids,
                                    ["id", "name"] // você pode adicionar mais campos se necessário
                                );
                                // Adiciona as opções à pergunta
                                question.options = options;
                            } else {
                                // Se não houver opções, apenas define como um array vazio
                                question.options = [];
                            }
                        }

                        // Agora inclui o formulário com suas perguntas e opções
                        startFormsWithQuestions.push({
                            form,       // Inclui o formulário
                            questions   // Associa as perguntas com as opções
                        });
                    }


                    // Carregar formulários de finalização
                    const endForms = await this.orm.read(
                        "type.forms",
                        activity.end_form_ids,
                        ["name", "id", "question_ids"]
                    );

                    // Carregar perguntas dos formulários de finalização
                    const endFormsWithQuestions = [];
                    for (const form of endForms) {
                        let questions = [];
                        if (form.question_ids.length) {
                            questions = await this.orm.read(
                                "question.fields",
                                form.question_ids,
                                ["id", "required", "name", "type_form", "options_ids", "conditional", "sub_question_id"]
                            );
                        }
                        // Agora para cada pergunta, buscamos as opções associadas
                        for (let question of questions) {
                            // Se a pergunta tiver opções, busque as opções associadas
                            if (question.sub_question_id) {
                                const sub_question = await this.orm.read(
                                    "sub.question.fields",
                                    question.sub_question_id,
                                    ["id", "required", "name", "type_form", "anwser", "conditional",] // você pode adicionar mais campos se necessário
                                );

                                question.sub_question = sub_question
                            }

                            if (question.options_ids.length) {
                                const options = await this.orm.read(
                                    "question.field.option",
                                    question.options_ids,
                                    ["id", "name"] // você pode adicionar mais campos se necessário
                                );
                                // Adiciona as opções à pergunta
                                question.options = options;
                            } else {
                                // Se não houver opções, apenas define como um array vazio
                                question.options = [];
                            }
                        }

                        endFormsWithQuestions.push({
                            form,       // Inclui o formulário
                            questions   // Associa as perguntas
                        });
                    }

                    // Atualiza o estado com formulários e perguntas
                    this.state.startForms = startFormsWithQuestions;
                    this.state.endForms = endFormsWithQuestions;
                }

                this.validateAnswers();

            }
        });

        this.checkStatusTask = async () => {
            const taskId = this.props.record.resId;
            const task = await this.orm.read("project.task", [taskId], ["state"]);
            console.log("Status da tarefa:", task[0].state === '1_done');
            return task[0].state === '1_done';

        }


        this.removeImage = (formId, questionId, imgSrc) => {
            if (!this.state.answers[formId] || !this.state.answers[formId][questionId]) {
                console.error("Não há imagens para remover.");
                return;
            }

            this.state.answers[formId][questionId] = this.state.answers[formId][questionId].filter(src => src !== imgSrc);
            this.render(); // Atualiza a interface
        };


        this.isFormAnswered = (formId) => {
            // Se o formulário estiver no modo de edição, ele não é considerado respondido
            if (!this.answeredMap[formId]) {
                return false;
            }

            // Caso contrário, verifica se há respostas salvas
            return (
                this.state.prevAnswers[formId] &&
                Object.keys(this.state.prevAnswers[formId]).length > 0
            );
        };

        this.updateAnswer = (formId, questionId, value, questionType = null, isChecked = null) => {
            if (!this.state.answers) {
                this.state.answers = {};
            }
            if (!this.state.answers[formId]) {
                this.state.answers[formId] = {};
            }

            if (questionType === 'check_list') {
                if (!Array.isArray(this.state.answers[formId][questionId])) {
                    this.state.answers[formId][questionId] = [];
                }

                const currentAnswers = this.state.answers[formId][questionId];

                if (isChecked) {
                    if (!currentAnswers.includes(value)) {
                        currentAnswers.push(value);
                    }
                } else {
                    this.state.answers[formId][questionId] = currentAnswers.filter(v => v !== value);
                }

            } else if (questionType === 'list') {
                // Se for list, só pode um valor: substitui direto
                if (isChecked) {
                    this.state.answers[formId][questionId] = [value];
                } else {
                    // Se desmarcar o único selecionado, limpa
                    this.state.answers[formId][questionId] = [];
                }

            } else {
                if (value === "") {
                    delete this.state.answers[formId][questionId];
                } else {
                    this.state.answers[formId][questionId] = value;
                }
            }

        };

        this.handleMultiFileUpload = (formId, questionId, ev) => {
            const files = ev.target.files;
            console.log("ID do formulário:", formId);

            if (!files || !files.length) return;

            // Garante que a estrutura exista
            if (!this.state.answers[formId]) {
                this.state.answers[formId] = {};
            }
            if (!Array.isArray(this.state.answers[formId][questionId])) {
                this.state.answers[formId][questionId] = [];
            }

            const readerPromises = Array.from(files).map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result); // Base64
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readerPromises).then(results => {
                // Adiciona todas as novas imagens à lista existente
                this.state.answers[formId][questionId].push(...results);
                console.log("Imagens carregadas:", this.state.answers[formId]);
                this.render(); // Atualiza a interface
            }).catch(error => {
                console.error("Erro ao carregar as imagens:", error);
            });

            // Reseta o input (permite reenviar a mesma imagem se quiser)
            ev.target.value = '';
        };

        this.saveSignature = async (formId, questionId, typeForm) => {
            if (!this.canvas) {
                console.error("Canvas não está definido!");
                return;
            }

            const canvas = this.canvas;
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            const tempCtx = tempCanvas.getContext("2d");

            // Desenha fundo branco
            tempCtx.fillStyle = "#ffffff";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Desenha assinatura por cima
            tempCtx.drawImage(canvas, 0, 0);

            // Converte em imagem base64
            const dataURL = tempCanvas.toDataURL("image/png");

            // Garantindo que a estrutura do estado exista
            if (!this.state.answers[formId]) {
                this.state.answers[formId] = {};
            }

            // Substitui a assinatura existente em vez de adicionar uma nova
            this.state.answers[formId][questionId] = [dataURL];

            console.log("Assinatura salva:", this.state.answers[formId][questionId]);

            // Desativa o modo de edição de assinatura
            if (this.state.editingSignature[formId]) {
                delete this.state.editingSignature[formId][questionId];
            }
            await this.isFormAnswered(formId)

            this.render(); // Atualiza a interface
        };


        onMounted(() => {
            this.loadCanvas();
        });
    };

    loadCanvas = async () => {
        const canvas = await this.canvasRef.el;
        if (!this.canvasRef.el) {
            console.error("Canvas não encontrado! Talvez o formulário já tenha sido respondido.");
            return;
        }
        console.log(canvas)
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = "round";
    }

    startDraw(e) {
        e.preventDefault();  // Para evitar que o toque cause o comportamento padrão (como scroll ou zoom)
        this.isDrawing = true;
        const [x, y] = this.getPosition(e);
        this.lastX = x;
        this.lastY = y;
    }

    draw(e) {
        if (!this.isDrawing) return;

        const [x, y] = this.getPosition(e);

        // Desenhando no canvas
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    stopDraw() {
        this.isDrawing = false;
    }

    getPosition(e) {

        if (!this.canvas) {
            console.error("Canvas não inicializado!");
            return [0, 0];
        }
        const rect = this.canvas.getBoundingClientRect();
        let x, y;

        if (e.touches && e.touches.length > 0) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // Ajustar o fator de escala, se o canvas tiver sido redimensionado em CSS
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return [x * scaleX, y * scaleY];
    }
    clearCanvas() {
        const canvas = this.canvas;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    async validateAnswers() {
        const existingAnswers = await this.orm.searchRead(
            "answers.forms",
            [["task_id", "=", this.props.record.resId]],
            ["forms_field_id", "question_id", "content_answer", "type_forms_id", "attachment_ids"] // Inclua attachment_ids para recuperar as imagens associadas
        );


        for (const answer of existingAnswers) {
            const formTypeId = answer.type_forms_id?.[0];
            const questionId = answer.question_id?.[0];
            const content = answer.content_answer;
            const attachmentIds = answer.attachment_ids; // IDs dos anexos

            if (formTypeId && questionId) {
                if (!this.state.prevAnswers[formTypeId]) {
                    this.state.prevAnswers[formTypeId] = {};
                }
                this.state.prevAnswers[formTypeId][questionId] = content;

                // Se houver anexos, adicione os links das imagens à resposta
                if (attachmentIds.length > 0) {
                    this.state.prevAnswers[formTypeId][questionId] = attachmentIds.map(id => `/web/image/ir.attachment/${id}/datas`);
                }

                // Marca essa pergunta como respondida
                if (!this.answeredMap[formTypeId]) {
                    this.answeredMap[formTypeId] = {};
                }
                this.answeredMap[formTypeId][questionId] = true;
            }
        }
    }

    async submitAnswers(formId) {
        if (!this.state.answers[formId]) {
            alert("Nenhuma resposta para enviar.");
            return;
        }

        const taskId = this.props.record.resId;
        const questions = this.state.answers[formId] || {};

        console.log("Estado atual das respostas antes do envio:", this.state.answers);
        console.log("Respostas para o formulário:", questions);

        // Validação de perguntas obrigatórias
        const requiredQuestions = await this.orm.searchRead("question.fields", [
            ["type_forms_id", "=", parseInt(formId)],
            ["required", "=", true]
        ], ["id"]);

        const requiredIds = requiredQuestions.map(q => q.id.toString());

        for (const questionId of requiredIds) {
            const answer = questions[questionId];
            if (!answer || (typeof answer === 'string' && answer.trim() === "") || (Array.isArray(answer) && answer.length === 0)) {
                alert("Por favor, preencha todas as perguntas obrigatórias antes de enviar.");
                return;
            }
        }

        // Verifica se já existe um formulário respondido
        const existingAnswers = await this.orm.searchRead("answers.forms", [
            ["task_id", "=", taskId],
            ["type_forms_id", "=", parseInt(formId)]
        ], ["id", "question_id"]);

        const existingAnswersMap = {};
        for (const answer of existingAnswers) {
            existingAnswersMap[answer.question_id[0]] = answer.id;
        }

        // Processa cada pergunta
        for (const [questionId, answer] of Object.entries(questions)) {
            if (Array.isArray(answer)) {
                const base64Images = answer.map(async (image) => {
                    if (image.startsWith('/web/image/')) {
                        // Converte URLs para Base64
                        return await this.convertUrlToBase64(image);
                    }
                    return image; // Já está em Base64
                });

                const resolvedBase64Images = await Promise.all(base64Images);

                let respostaId;

                // Verifica se já existe uma resposta para a pergunta
                if (existingAnswersMap[parseInt(questionId)]) {
                    respostaId = existingAnswersMap[parseInt(questionId)];

                    // Exclui os anexos existentes associados à resposta
                    const existingAttachments = await this.orm.searchRead("ir.attachment", [
                        ["res_model", "=", "answers.forms"],
                        ["res_id", "=", respostaId]
                    ], ["id"]);

                    const attachmentIds = existingAttachments.map(att => att.id);
                    if (attachmentIds.length > 0) {
                        await this.orm.unlink("ir.attachment", attachmentIds);
                    }

                    // Atualiza a resposta existente
                    await this.orm.write("answers.forms", [respostaId], {
                        content_answer: "Ver anexos"
                    });
                } else {
                    // Cria uma nova resposta
                    const [newRespostaId] = await this.orm.create("answers.forms", [{
                        question_id: parseInt(questionId),
                        content_answer: "Ver anexos",
                        task_id: taskId,
                        type_forms_id: parseInt(formId)
                    }]);
                    respostaId = newRespostaId;
                }

                // Cria novos anexos para todas as imagens em Base64
                for (const imageBase64 of resolvedBase64Images) {
                    if (imageBase64) {
                        await this.orm.create("ir.attachment", [{
                            name: 'imagem.png',
                            type: 'binary',
                            datas: imageBase64.split(',')[1],
                            res_model: 'answers.forms',
                            res_id: respostaId,
                            mimetype: 'image/png',
                        }]);
                    }
                }
            } else {
                // Resposta de texto ou número
                if (existingAnswersMap[parseInt(questionId)]) {
                    // Atualiza a resposta existente
                    await this.orm.write("answers.forms", [existingAnswersMap[parseInt(questionId)]], {
                        content_answer: answer
                    });
                } else {
                    // Cria uma nova resposta
                    await this.orm.create("answers.forms", [{
                        question_id: parseInt(questionId),
                        content_answer: answer,
                        task_id: taskId,
                        type_forms_id: parseInt(formId)
                    }]);
                }
            }
        }

        alert("Respostas enviadas com sucesso!");
        this.state.answers[formId] = {};
        this.validateAnswers();
        this.render();

    }

    editAnswers(formId) {
        console.log("ID do formulário:", formId);

        // Remove o formulário do mapa de "respondidos" para permitir edição
        if (this.answeredMap[formId]) {
            delete this.answeredMap[formId];
        }

        // Copia as respostas salvas para o estado atual para edição
        if (this.state.prevAnswers[formId]) {
            this.state.answers[formId] = this.state.prevAnswers[formId]; // Faz uma cópia profunda
        } else {
            console.warn(`Nenhuma resposta salva encontrada para o formulário ID: ${formId}`);
        }

        // Atualiza a interface para refletir o estado editável
        this.render();
    }

    async enableSignatureEdit(formId, questionId) {
        console.log("ID do formulário:", formId);

        if (!this.state.editingSignature[formId]) {
            this.state.editingSignature[formId] = {};
        }
        this.state.editingSignature[formId][questionId] = true;
        this.render(); // Atualiza a interface



        /// Aguarde a renderização do canvas
        setTimeout(async () => {
            await this.loadCanvas();
            if (this.canvasRef.el) {
                console.log("Canvas encontrado, limpando...");
                const ctx = this.canvasRef.el.getContext("2d");
                ctx.clearRect(0, 0, this.canvasRef.el.width, this.canvasRef.el.height);
            } else {
                console.error("Canvas não encontrado! Verifique se o elemento foi renderizado corretamente.");
            }
        }, 0);

        this.render(); // Atualiza a interface
    }

    openImageModal(imgSrc) {
        this.state.imageModalVisible = true;
        this.state.modalImageSrc = imgSrc;
        this.render();  // Força re-render  
    }

    closeImageModal() {
        this.state.imageModalVisible = false;
        this.state.modalImageSrc = null;
        this.render();
    }
    async convertUrlToBase64(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro ao buscar o anexo: ${response.statusText}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Erro ao converter URL para base64:", error);
            return null;
        }
    }
}


FormsFieldsWidget.template = "forms_field.FormsFieldsWidget";

registry.category("fields").add("forms_field", {
    component: FormsFieldsWidget,
    supportedTypes: ["many2one"],
});
