from odoo import models, fields, api

class QuestionFields(models.Model):
    _name = 'question.fields'
    _description = 'Questões para os formulários para o serviço de campo'

    name = fields.Char(string='Nome', required=True)
    
    type_form = fields.Selection([
        ('long_answer', 'Resposta Longa'),
        ('short_answer', 'Resposta Curta'), 
        ('numeric', 'Numérico'),
        ('photo', 'Foto'),
        ('list', 'Lista'),
        ('check_list', 'Check List'),
        ('multiple_choice', 'Múltipla escolha'),
        ('signature', 'Assinatura'),
    ], string='Tipo', required=True)

    required = fields.Boolean(string="Obrigatória") 
    conditional = fields.Boolean(string="Condicional") 
    type_forms_id = fields.Many2one('type.forms', string='Formulário')

    sub_question_id = fields.One2many('sub.question.fields', 'question_parent_field_id', string='Sub pergunta')


    options_ids = fields.One2many('question.field.option', 'question_field_id', string='Opções')
