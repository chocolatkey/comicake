from django.forms.widgets import Textarea
from django.utils.safestring import mark_safe
from django.utils.translation import get_language, get_language_info
from django.urls import reverse
from django.conf import settings
class TrumbowygWidget(Textarea):
    class Media:
        extra = '' if settings.DEBUG else '.min'
        css = {
            'all': (
                'admin/trumbowyg/ui/trumbowyg.min.css',
                'admin/trumbowyg/trumbowyg.django.css',
            )
        }
        js = (
            'admin/js/jquery.init.js', # Häh? Include this and everything else comes with it...
            'admin/trumbowyg/trumbowyg%s.js' % extra,
            'admin/trumbowyg/plugins/cleanpaste/trumbowyg.cleanpaste.js',
            'admin/trumbowyg/plugins/colors/trumbowyg.colors.js',
            'admin/trumbowyg/plugins/ruby/trumbowyg.ruby.js',
            'admin/trumbowyg/plugins/table/trumbowyg.table.js',
            'admin/trumbowyg/plugins/upload/trumbowyg.upload.js',
        )

    def render(self, name, value, attrs=None, renderer=None):
        output = super(TrumbowygWidget, self).render(name, value, attrs, renderer)
        script = u'''
            <script>
            (function($) {
               $("#id_%s").trumbowyg({
                    lang: "%s",
                    resetCss: true,
                    autogrow: true,
                    removeformatPasted: true,
                    btns: [
                        ['viewHTML'],
                        ['undo', 'redo'], // Only supported in Blink browsers
                        ['formatting', 'foreColor', 'backColor'],
                        ['strong', 'em', 'del', 'underline'],
                        ['superscript', 'subscript', 'ruby'],
                        ['link'],
                        ['insertImage', 'upload', 'table'],
                        ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
                        ['unorderedList', 'orderedList'],
                        ['horizontalRule'],
                        ['removeformat'],
                    ],
                    plugins: {
                        upload: {
                            serverPath: "%s",
                            fileFieldName: "image"
                        }
                    }
                });  
            })(django.jQuery); 
            </script>
        ''' % (name, get_language_info(get_language())['code'], reverse('trumbowyg_upload_image'))
        output += mark_safe(script)
        return output
