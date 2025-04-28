from odoo import models, fields

class ActivityTypesField(models.Model):
    _name = 'activity.types.field'
    _description = 'Tipos de atividades para o time de campo'

    name = fields.Char(string='Nome', required=True)

    start_form_ids = fields.Many2many(
        'type.forms',
        'activity_type_start_form_rel',
        'activity_type_id',
        'type_forms_id',
        string='Formulários obrigatórios para iniciar'
    )

    end_form_ids = fields.Many2many(
        'type.forms',
        'activity_type_end_form_rel',  # <- aqui o nome da tabela foi alterado!
        'activity_type_id',
        'type_forms_id',
        string='Formulários obrigatórios para finalizar'
    )
