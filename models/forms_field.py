from odoo import models, fields

class FormsField(models.Model):
    _name = 'forms.field'
    _description = 'Formulários com as questões'
        
    answers_ids = fields.One2many('answers.forms', 'forms_field_id', string='Respostas')
    questions_id = fields.One2many('answers.forms', 'forms_field_id', string='Questões')
    task_id = fields.Many2one('project.task', string='Tarefa')

