from odoo import models, fields, api

class SubQuestionFields(models.Model):
    _name = 'sub.question.fields'
    _description = 'Sub Questões para os formulários para o serviço de campo'

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

    conditional = fields.Selection([
        ('equal', 'Igual'),
        ('different', 'Diferente'), 
    ], string='Condição', required=True)

    anwser = fields.Selection([
        ('yes', 'Sim'),
        ('no', 'Não'), 
    ], string='Condição', required=True)

    required = fields.Boolean(string="Obrigatória") 

    question_parent_field_id = fields.Many2one('question.fields', string='Questão Pai')

