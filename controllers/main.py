import base64
from odoo import http
from odoo.http import request

class FormController(http.Controller):

    @http.route('/submit/image/answer', type='json', auth='user')
    def submit_image_answer(self, task_id, question_id, form_id, field_id, images):
        """
        Recebe imagens base64 e cria a resposta e os anexos
        """
        # Cria a resposta do tipo imagem
        answer = request.env['answers.forms'].create({
            'task_id': task_id,
            'question_id': question_id,
            'type_forms_id': form_id,
            'forms_field_id': field_id,
            'content_answer': 'imagem',  # ou outro marcador
        })

        # Para cada imagem, cria um attachment
        for img in images:
            request.env['ir.attachment'].create({
                'name': f'image_{question_id}.png',
                'res_model': 'answers.forms',
                'res_id': answer.id,
                'type': 'binary',
                'datas': img,  # <- deve estar em base64 sem o prefixo (ex: 'data:image/png;base64,...')
                'mimetype': 'image/png',
            })

        return {'success': True, 'answer_id': answer.id}
