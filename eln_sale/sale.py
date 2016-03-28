# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2004-2012 Pexego Sistemas Informáticos All Rights Reserved
#    $Marta Vázquez Rodríguez$ <marta@pexego.es>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as published
#    by the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
from openerp.osv import orm, fields
from datetime import datetime
from dateutil.relativedelta import relativedelta
from openerp.tools.translate import _
import time


class sale_order(orm.Model):
    _inherit = 'sale.order'

    _columns = {
        'supplier_id': fields.many2one('res.partner', 'Supplier', readonly=True,domain = [('supplier','=',True)],states={'draft': [('readonly', False)]}, select=True),
        'order_policy': fields.selection([
            ('prepaid', 'Pay before delivery'),
            ('manual', 'Deliver & invoice on demand'),
            ('picking', 'Invoice based on deliveries'),
            ('postpaid', 'Invoice on order after delivery'),
            ('no_bill', 'No bill')
        ], 'Invoice Policy', required=True, readonly=True, states={'draft': [('readonly', False)]}, change_default=True),
        'commitment_date': fields.date('Commitment Date', help="Date on which delivery of products is to be made.", readonly=True, states={'draft': [('readonly', False)],'waiting_date': [('readonly', False)],'manual': [('readonly', False)],'progress': [('readonly', False)]}),
        'supplier_cip': fields.char('CIP', help="Código interno del proveedor.", size=32, readonly=True, states={'draft': [('readonly', False)],'waiting_date': [('readonly', False)],'manual': [('readonly', False)],'progress': [('readonly', False)]}),
        'shop_id': fields.many2one('sale.shop', 'Sale type', required=True),
        'commercial_partner_id': fields.many2one('res.partner',
                                                 invisible=True)
    }

    def onchange_shop_id(self, cr, uid, ids, shop_id):
        v = {}
        if shop_id:
            shop = self.pool.get('sale.shop').browse(cr, uid, shop_id)
            v['project_id'] = shop.project_id.id
            v['company_id'] = shop.company_id.id
            # overriden by the customer priceslist if existing
            if shop.pricelist_id.id:
                v['pricelist_id'] = shop.pricelist_id.id
            if shop.supplier_id.id:
                v['supplier_id'] = shop.supplier_id.id
            if shop.order_policy:
                v['order_policy'] = shop.order_policy
            if shop.warehouse_id:
                v['warehouse_id'] = shop.warehouse_id.id
            v['order_policy'] = shop.order_policy
            v['supplier_id'] = shop.supplier_id.id

        return {'value': v}

    def onchange_shop_id2(self, cr, uid, ids, shop_id, partner_id=False, project_id=False):
        res = self.onchange_shop_id(cr, uid, ids, shop_id)
        if project_id:
            res['value']['project_id'] = project_id
        if not shop_id:
            res['value']['pricelist_id'] = False
            return res

        if partner_id:
            shop_obj = self.pool.get('sale.shop').browse(cr, uid, shop_id)
            partner_obj = self.pool.get('res.partner').browse(cr, uid, partner_id)

            if shop_obj.indirect_invoicing:
                if partner_obj.property_product_pricelist_indirect_invoicing:
                    res['value']['pricelist_id'] = partner_obj.property_product_pricelist_indirect_invoicing.id
            else:
                if partner_obj.property_product_pricelist:
                    res['value']['pricelist_id'] = partner_obj.property_product_pricelist.id

        return res

    def create(self, cr, uid, vals, context=None):
        """overwrites create method to set commitment_date automatically"""
        #if vals.get('order_line', []):
        #    dates_list = []
        #    for line in vals['order_line']:
        #        line = line[2]
        #        dt = datetime.strptime(vals['date_order'], '%Y-%m-%d') + relativedelta(days=line['delay'] or 0.0)
        #        dt_s = dt.strftime('%Y-n%m-%d')
        #        dates_list.append(dt_s)
        #    if dates_list and not vals.get('commitment_date'):
        #        vals.update({'commitment_date': min(dates_list)})
        return super(sale_order, self).create(cr, uid, vals, context=context)

    def action_ship_create(self, cr, uid, ids, *args):
        res = super(sale_order, self).action_ship_create(cr, uid, ids, *args)

        for order in self.browse(cr, uid, ids):
            if order.picking_ids and order.supplier_id:
                for picking in order.picking_ids:
                    if picking.state != 'cancel' and not picking.supplier_id:
                        self.pool.get('stock.picking').write(cr, uid, picking.id, {'supplier_id': order.supplier_id.id})
        return res

    def onchange_partner_id(self, cr, uid, ids, part, context=None):
        res = super(sale_order, self).onchange_partner_id(cr, uid, ids, part, context)
        company_id = self.pool.get('res.users').browse(cr, uid, [uid]).company_id.id
        partner = self.pool.get('res.partner').browse(cr, uid, part)
        commercial_partner = partner.commercial_partner_id.id
        rec = self.pool.get('account.analytic.default').account_get(cr, uid, product_id=False, partner_id=commercial_partner, user_id=uid,
                                                                    date=time.strftime('%Y-%m-%d'),company_id=company_id, context={})
        if rec:
            res['value']['project_id'] = rec.analytic_id.id
        else:
            res['value']['project_id'] = False

        #Modificamos para que la dirección de factura sea la que tenga la empresa padre
        addr = self.pool.get('res.partner').address_get(cr, uid, [commercial_partner], ['invoice'])
        res['value']['partner_invoice_id'] = \
            addr['invoice']

        return res

    def onchange_partner_id3(self, cr, uid, ids, part, early_payment_discount=False, payment_term=False, shop=False):
        """extend this event for change the pricelist when the shop is to indirect invoice"""
        res = self.onchange_partner_id2(cr, uid, ids, part, early_payment_discount, payment_term)
        partner_obj = self.pool.get('res.partner').browse(cr, uid, part)
        res['value']['commercial_partner_id'] = \
            partner_obj.commercial_partner_id.id
        if not part:
            res['value']['pricelist_id'] = False
            return res

        if shop:
            shop_obj = self.pool.get('sale.shop').browse(cr, uid, shop)

            if shop_obj.pricelist_id and shop_obj.pricelist_id.id:
                res['value']['pricelist_id'] = shop_obj.pricelist_id.id

            if shop_obj.indirect_invoicing:
                if partner_obj.commercial_partner_id.property_product_pricelist_indirect_invoicing:
                    res['value']['pricelist_id'] = \
                        partner_obj.commercial_partner_id.property_product_pricelist_indirect_invoicing.id
            else:
                if partner_obj.commercial_partner_id.property_product_pricelist:
                    res['value']['pricelist_id'] = \
                        partner_obj.commercial_partner_id.property_product_pricelist.id
        else:
            res['value']['pricelist_id'] = \
                partner_obj.commercial_partner_id.property_product_pricelist.id


        return res

class sale_order_line(orm.Model):
    _inherit = 'sale.order.line'

    def product_uos_change(self, cursor, user, ids, pricelist, product, qty=0,
            uom=False, qty_uos=0, uos=False, name='', partner_id=False,
            lang=False, update_tax=True, date_order=False):
        res = {}
        if product:
            product_obj = self.pool.get('product.product').browse(cursor, user, product)
            if uos:
                qty_uom = 0.0
                if self.pool.get('product.uom').browse(cursor, user, uos).category_id.id == product_obj.uos_id.category_id.id:
                    if qty_uos:
                        if product_obj.uos_coeff:
                            qty_uom = qty_uos / product_obj.uos_coeff
                            uom = product_obj.uom_id.id
                        res = self.product_id_change(cursor, user, ids, pricelist, product,
                            qty=qty_uom, uom=False, qty_uos=qty_uos, uos=uos, name=name,
                            partner_id=partner_id, lang=lang, update_tax=update_tax,
                            date_order=date_order)
                        if 'product_uom' in res['value']:
                            del res['value']['product_uom']
        return res

    def product_id_change2(self, cr, uid, ids, pricelist, product, qty=0,
            uom=False, qty_uos=0, uos=False, name='', partner_id=False,
            lang=False, update_tax=True, date_order=False, packaging=False, fiscal_position=False, flag=False, sale_agent_ids=False, context=None):
        """Modificamos para que pase como parámetro la uom y/o la uos del producto al que estamos cambiando
        y no las del producto que estaba antes. Si sólo pasamos la uom hace conversión de cantidad a cantidad de venta, pero si pasamos
        también la uos hace la conversión de la unidad de venta a la unidad de compra.
        En el on_change del producto pasamos en el contexto force_product_uom=True"""
        if context is None:
            context = {}

        if product:
            product_obj = self.pool.get('product.product')
            product_obj = product_obj.browse(cr, uid, product, context=context)
            uom = product_obj.uom_id.id or False
            uos = product_obj.uos_id.id or False

        res = super(sale_order_line, self).product_id_change2(cr, uid, ids, pricelist, product, qty, uom, qty_uos, uos, name, partner_id, lang, update_tax, date_order, packaging, fiscal_position, flag, sale_agent_ids, context)

        if not res['value'].get('product_uos', False):
            res['value']['product_uos'] = uos or False

        # - set a domain on product_uom
        if product:
            res['domain'] = {'product_uom': [('category_id', '=', product_obj.uom_id.category_id.id)]}

        # - set a procure_method if exist a pull flow in the product to 'make_to_order'
        # Los flujos arrastrados solo funcionan con método abastecimiento make_to_order,
        # por eso se hace que el onchange lo cambie si es necesario solo
        # si hay un flujo arrastrado para esa ubicacion (tienda/almacen)
        if product and context.get('shop', False):
            shop_obj = self.pool.get('sale.shop').browse(cr, uid, context['shop'])
            warehouse_obj = self.pool.get('stock.warehouse').browse(cr, uid, shop_obj.warehouse_id.id)
            warehouse_location_id = warehouse_obj.lot_stock_id

            for flow_pull_id in product_obj.flow_pull_ids:
                #Si algún flujo tiene localización destino igual a la localización de
                #existencias de la tienda (almacén) significa que se ejecutará el flujo,
                #por tanto se controla el método de abastecimiento
                if flow_pull_id.location_id == warehouse_location_id and flow_pull_id.type_proc == 'move':
                    res['value']['type'] = 'make_to_order' #'make_to_order' sino no funciona correctamente el flujo
        # - end of set a procure_method if exist a pull flow in the product

        return res

    def product_uom_change(self, cr, uid, ids, pricelist, product, qty=0,
            uom=False, qty_uos=0, uos=False, name='', partner_id=False,
            lang=False, update_tax=True, date_order=False, context=None):
        """
        Modificamos para que solo permita seleccionar una unidad de medida de la misma categoría y si
        se selecciona una de diferente categoría pone la que tiene por defecto el producto.
        Lo usamos también para la unidad de venta. En este caso si cambia ponemos siempre la asignada en el producto.
        Última modificación: se comenta la parte de la categoría y se añade uom = product_obj.uom_id.id or False para que no se pueda
        cambiar la unidad de medida por defecto tampoco en la venta. (no se pone readonly=True en la vista porque sino no se guarda el valor)
        Con todo esto evitamos sobre todo problemas en precios en facturas (_get_price_unit_invoice)
        """
        if product:
            product_obj = self.pool.get('product.product')
            product_obj = product_obj.browse(cr, uid, product, context=context)
            uom = product_obj.uom_id and product_obj.uom_id.id or False
            uos = product_obj.uos_id and product_obj.uos_id.id or False
            #if uom:
            #    product_uom_obj = self.pool.get('product.uom')
            #    product_uom_obj = product_uom_obj.browse(cr, uid, uom, context=context)
            #    uom_cat1 = product_obj.uom_id.category_id or False
            #    uom_cat2 = product_uom_obj.category_id or False
            #    if uom_cat1 != uom_cat2:
            #        uom = product_obj.uom_id.id or False

        res = super(sale_order_line, self).product_uom_change(cr, uid, ids, pricelist, product, qty, uom, qty_uos, uos, name, partner_id, lang, update_tax, date_order, context)

        res['value']['product_uom'] = uom
        res['value']['product_uos'] = uos

        if product:
            res['domain'] = {'product_uom': [('category_id', '=', product_obj.uom_id.category_id.id)]} #Esto sobra porque tenemos fijada la uom y no se permite cambiar

        return res

    # POST-MIGRATION, VER COMO RESOLVER PRODUCTS.PACKAGING NO EXISTE ES PACKING_IDS
    # Y PUEDE QUE NO SEA NECESARIO YA QUE NO HAY ONCHANGE
    # def product_packaging_change(self, cr, uid, ids, pricelist, product, qty=0, uom=False,
    #                                partner_id=False, packaging=False, flag=False, context=None):
    #     """Reescribo la función original de addons/sale/sale.py, ya que no queremos que compruebe si el empaquetado es correcto"""
    #
    #     if not product:
    #         return {'value': {'product_packaging': False}}
    #
    #     product_obj = self.pool.get('product.product')
    #     result = {}
    #     products = product_obj.browse(cr, uid, product, context=context)
    #
    #     if not products.packaging:
    #         packaging = result['product_packaging'] = False
    #     elif not packaging and products.packaging and not flag:
    #         packaging = products.packaging[0].id
    #         result['product_packaging'] = packaging
    #
    #     return {'value': result}
