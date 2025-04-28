from odoo import models, fields

class TypeForms(models.Model):
    _name = 'type.forms'
    _description = 'Formulários para o serviço de campo'

    name = fields.Char(string='Nome', required=True)
    
    question_ids = fields.One2many('question.fields', 'type_forms_id', string='Questões')
