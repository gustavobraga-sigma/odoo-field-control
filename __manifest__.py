{
    'name': 'Modulo customizado para o time de campo',
    'version': '1.0',
    'author': 'Gustavo Braga',
    'depends': ['base', 'fleet', 'project', "industry_fsm"],
    'assets': {
        'web.assets_backend': [
            'field_service/static/src/**/*',
             ("include", "https://cdnjs.cloudflare.com/ajax/libs/signature_pad/4.0.0/signature_pad.umd.min.js"),
        ],
    },
    'data': [
        'security/fsm_security_control.xml',
        'security/ir.model.access.csv',
        'security/project_task_rules.xml',  # <-- seu arquivo novo aqui
        'views/forms_fields_menu_action.xml',
        'views/forms_fields_menu_view.xml',
        'views/forms_fields_view.xml',
        'views/question_fields_view.xml',
        'views/activity_types_field_views.xml',
        'views/project_task_views.xml',
        'views/fleet_vehicle_odometer_view_form.xml',
    ],
    'installable': True,
    'application': False,
}
