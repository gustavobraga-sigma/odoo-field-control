from odoo import models, fields, exceptions, api, _
import logging

_logger = logging.getLogger(__name__)

class ProjectTask(models.Model):
    _inherit = 'project.task'

    activity_field_id = fields.Many2one(
        'activity.types.field',
        string='Tipo de Atividade'
    )

    def action_timer_start(self):
        for task in self:
            _logger.info("⏱️ Tentando iniciar o timer da tarefa ID: %s", task.id)

            activity_field = task.activity_field_id
            if activity_field:
                forms = activity_field.start_form_ids  # Verifica os formulários de início
                unanswered_questions = []

                for form in forms:
                    for question in form.question_ids.filtered(lambda q: q.required):  # Verifica apenas perguntas obrigatórias
                        has_answer = self.env['answers.forms'].search_count([
                            ('task_id', '=', task.id),
                            ('question_id', '=', question.id),
                            ('type_forms_id', '=', form.id),
                        ])
                        if not has_answer:
                            unanswered_questions.append(question.name)

                    if unanswered_questions:
                        _logger.warning("Formulário '%s' possui perguntas obrigatórias não respondidas: %s", form.name, unanswered_questions)
                        raise exceptions.UserError(
                            _("O formulário \"%s\" não foi totalmente respondido.\n"
                              "Perguntas obrigatórias pendentes:\n- %s") % (form.name, "\n- ".join(unanswered_questions))
                        )

        # Se tudo certo, chama o comportamento padrão (original)
        return super(ProjectTask, self).action_timer_start()
        
    def action_timer_stop(self):
        for task in self:
            _logger.info("⏱️ Tentando parar o timer da tarefa ID: %s", task.id)

            activity_field = task.activity_field_id
            if activity_field:
                forms = activity_field.end_form_ids
                unanswered_questions = []

                for form in forms:
                    for question in form.question_ids.filtered(lambda q: q.required):  # Verifica apenas perguntas obrigatórias
                        has_answer = self.env['answers.forms'].search_count([
                            ('task_id', '=', task.id),
                            ('question_id', '=', question.id),
                            ('type_forms_id', '=', form.id),
                        ])
                        if not has_answer:
                            unanswered_questions.append(question.name)

                    if unanswered_questions:
                        raise exceptions.UserError(
                            _("O formulário \"%s\" não foi totalmente respondido.\n"
                              "Perguntas obrigatórias pendentes:\n- %s") % (form.name, "\n- ".join(unanswered_questions))
                        )

        # Se tudo certo, chama o comportamento padrão (original)
        return super().action_timer_stop()
