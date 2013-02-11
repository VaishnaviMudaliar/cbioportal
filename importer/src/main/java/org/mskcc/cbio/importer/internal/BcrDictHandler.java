/*
 * Copyright (c) 2012 Memorial Sloan-Kettering Cancer Center.
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  The software and
 * documentation provided hereunder is on an "as is" basis, and
 * Memorial Sloan-Kettering Cancer Center
 * has no obligations to provide maintenance, support,
 * updates, enhancements or modifications.  In no event shall
 * Memorial Sloan-Kettering Cancer Center
 * be liable to any party for direct, indirect, special,
 * incidental or consequential damages, including lost profits, arising
 * out of the use of this software and its documentation, even if
 * Memorial Sloan-Kettering Cancer Center
 * has been advised of the possibility of such damage.  See
 * the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation,
 * Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA.
 */
package org.mskcc.cbio.importer.internal;

import org.mskcc.cbio.cgds.model.ClinicalAttribute;
import org.mskcc.cbio.importer.model.ClinicalAttributesMetadata;
import org.xml.sax.*;
import org.xml.sax.helpers.DefaultHandler;

import java.util.List;

/**
 * Handles SAX XML element events for parsing data from the Biospecimen Core Resource (BCR) Data Dictionary
 */
public class BcrDictHandler extends DefaultHandler {
    private List<ClinicalAttributesMetadata> metadatas;
    private ClinicalAttributesMetadata currMetadata;
    private boolean inAttr = false;
    private StringBuilder content;

    /**
     * Constructor
     * @param metadatas    the list to add parsed clinical attributes to
     */
    public BcrDictHandler(List<ClinicalAttributesMetadata> metadatas) {
        this.metadatas = metadatas;
        this.content = new StringBuilder();
    }

    /**
     * Event handler for the start of an XML element
     *
     * @param uri
     * @param localName
     * @param qName
     * @param attributes
     * @throws SAXException
     */
    public void startElement(String uri, String localName, String qName,
                             Attributes attributes) throws SAXException {
        content.setLength(0);
        if ("dictEntry".equals(qName)) {
            inAttr = true;
            currMetadata = new ClinicalAttributesMetadata();
            currMetadata.setDisplayName(attributes.getValue("name"));
        }
        else if ("XMLeltInfo".equals(qName)){
            // the broad replaces all "_" with "" in their firehose runs
            currMetadata.setAliases(attributes.getValue("xml_elt_name").replaceAll("_", ""));
        }
    }

    /**
     * Event handler for the end of an XML element
     *
     * @param uri
     * @param localName
     * @param qName
     * @throws SAXException
     */
    public void endElement(String uri, String localName, String qName) throws SAXException {
        if (inAttr) {
            if ("caDSRdefinition".equals(qName)) {
                currMetadata.setDescription(content.toString());
            }
            else if ("dictEntry".equals(qName)) {
                this.inAttr = false;
                metadatas.add(currMetadata);
            }
        }
    }

    /**
     * Handler for parsing the content of an XML element
     *
     * @param ch
     * @param start
     * @param end
     */
    public void characters(char ch[], int start, int end) {
        this.content.append(ch, start, end);
    }
}
