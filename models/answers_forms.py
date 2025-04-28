from odoo import models, fields

class AnswersForms(models.Model):
    _name = 'answers.forms'
    _description = 'Respostas das perguntas dos formulários'

    forms_field_id = fields.Many2one('forms.field', string='Formulário')

    question_id = fields.Many2one('question.fields', string='Pergunta')
    sub_question_id = fields.Many2one('sub.question.fields', string='Pergunta')

    content_answer = fields.Char(string='Conteudo', required=True)
    task_id = fields.Many2one('project.task', string='Tarefa')
    type_forms_id = fields.Many2one('type.forms', string='Formulário')
    
    # Campo computado para acessar os anexos relacionados
    attachment_ids = fields.One2many(
        'ir.attachment', 'res_id',
        domain=[('res_model', '=', 'answers.forms')],
        string='Imagens relacionadas'
    )