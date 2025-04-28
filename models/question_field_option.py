from odoo import models, fields

class QuestionFieldOption(models.Model):
    _name = 'question.field.option'
    _description = 'Opções para campos de pergunta'

    name = fields.Char(string='Opção', required=True)
    question_field_id = fields.Many2one('question.fields', string='Questão')
