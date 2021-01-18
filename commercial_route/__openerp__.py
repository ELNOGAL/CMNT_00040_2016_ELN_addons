# -*- coding: utf-8 -*-
# Copyright 2021 El Nogal - Pedro Gómez <pegomez@elnogal.com>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "Commercial Routes",
    "version": '8.0.1.0.1',
    "category": 'Sale',
    "description": """Commercial routes""",
    "author": 'Pedro Gómez',
    "website": 'www.elnogal.com',
    "depends": [
        'sale',
        'stock',
        'account',
     ],
    "init_xml": [],
    "data": [
        'security/ir.model.access.csv',
        'views/account_invoice_view.xml',
        'views/commercial_route_view.xml',
        'views/res_partner_view.xml',
        'views/sale_order_view.xml',
    ],
    "demo_xml": [],
    "active": False,
    "installable": True
}