from odoo import models, fields

class FleetVehicleOdometer(models.Model):
    _inherit = 'fleet.vehicle.odometer'

    photo = fields.Binary(string="Foto do Odômetro0", required=True)
    employee_id = fields.Many2one('hr.employee', string="Motorista", required=True)

