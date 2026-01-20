import os
import requests
from dotenv import load_dotenv

load_dotenv()

HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")


def simplify_text(text, max_length=150, min_length=30):
    if not text or len(text.strip()) == 0:
        return {
            "success": False,
            "original": text,
            "simplified": "",
            "error": "No text provided"
        }
    
    if HF_API_TOKEN:
        try:
            print("🔄 Attempting to use Hugging Face API...")
            result = _simplify_with_huggingface_api(text, max_length, min_length)
            if result["success"]:
                print("✅ Used Hugging Face API for simplification")
                return result
            else:
                print(f"⚠️ API returned failure: {result.get('error')}")
        except Exception as e:
            print(f"⚠️ API failed, using rule-based: {e}")
    else:
        print("ℹ️ No API token found, using rule-based simplification")
    
    return _enhanced_rule_based_simplification(text)


def _simplify_with_huggingface_api(text, max_length=150, min_length=30):
    
    API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"
    
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": text,
        "parameters": {
            "max_length": max_length,
            "min_length": min_length,
            "do_sample": False
        }
    }
    
    try:
        print(f"🔄 Calling API: {API_URL}")
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"📦 Response: {result}")
            
            simplified = ""
            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], dict):
                    simplified = result[0].get("summary_text", "") or result[0].get("generated_text", "")
                else:
                    simplified = str(result[0])
            elif isinstance(result, dict):
                simplified = result.get("summary_text", "") or result.get("generated_text", "")
            
            if simplified:
                print(f"✅ Got simplified text ({len(simplified)} chars)")
                return {
                    "success": True,
                    "original": text,
                    "simplified": simplified,
                    "model": "huggingface-api (bart-large-xsum)",
                    "readability_improvement": _calculate_readability_improvement(text, simplified)
                }
        
        elif response.status_code == 503:
            print("⏳ Model is loading, please wait...")
            return {"success": False, "error": "Model loading, try again in 20 seconds"}
        
        print(f"❌ API failed with status {response.status_code}")
        print(f"📄 Response: {response.text[:500]}")
        return {"success": False, "error": f"API status {response.status_code}"}
        
    except requests.exceptions.Timeout:
        print("⏱️ API timeout")
        return {"success": False, "error": "API timeout"}
    except Exception as e:
        print(f"💥 Exception: {str(e)}")
        return {"success": False, "error": str(e)}


def _enhanced_rule_based_simplification(text):
    """fallback rule-based simplification optimized for cognitive accessibility if api fails"""
    import re
    
    simplified = text
    
    replacements = {
        r'\bproliferation\b': 'spread',
        r'\bmultifaceted\b': 'complex',
        r'\bunprecedented\b': 'new and unusual',
        r'\befficiency gains\b': 'improvements',
        r'\bpredictive insight\b': 'predictions',
        r'\bscalable\b': 'can grow',
        r'\bintegration\b': 'combining',
        r'\binstitutional\b': 'organizational',
        r'\blatent\b': 'hidden',
        r'\brigidities\b': 'strict rules',
        r'\bdeficiencies\b': 'weaknesses',
        r'\bdeployment\b': 'use',
        r'\bredistributes\b': 'shares differently',
        r'\baccountability\b': 'responsibility',
        r'\breshapes\b': 'changes',
        r'\bmanagerial\b': 'management',
        r'\bdeliberate alignment\b': 'careful matching',
        r'\bregulatory frameworks\b': 'rules and laws',
        r'\bamplifying\b': 'increasing',
        r'\bexacerbating\b': 'making worse',
        r'\bundermining\b': 'weakening',
        r'\bstakeholder trust\b': 'people\'s trust',
        r'\borganizational contexts\b': 'workplaces',
        r'\btechnological capabilities\b': 'technology',
        r'\boperational inefficiencies\b': 'work problems',
        r'\bperformance improvements\b': 'better results',
        r'\balgorithmic systems\b': 'computer programs',
        r'\bdecision-making\b': 'making choices',
        r'\bgovernance\b': 'management',
        r'\bpower dynamics\b': 'who has power',
        r'\bneurodiversity\b': 'different ways of thinking',
        r'\bcognitive processing\b': 'how we think',
        r'\blearner populations\b': 'students',
        r'\bnecessitates\b': 'needs',
        r'\bimplementation\b': 'use',
        
        r'\babstract\b': 'general idea',
        r'\baccommodate\b': 'make room for',
        r'\baccompany\b': 'go with',
        r'\baccomplish\b': 'do',
        r'\baccordingly\b': 'so',
        r'\baccumulate\b': 'gather',
        r'\baccelerate\b': 'speed up',
        r'\baccentuate\b': 'highlight',
        r'\bacquire\b': 'get',
        r'\badditional\b': 'more',
        r'\badverse\b': 'bad',
        r'\badvocate\b': 'support',
        r'\baggregate\b': 'total',
        r'\ballocate\b': 'give out',
        r'\balternative\b': 'other choice',
        r'\bameliorate\b': 'make better',
        r'\banalyze\b': 'study',
        r'\banticipate\b': 'expect',
        r'\bapparent\b': 'clear',
        r'\bapproximate(ly)?\b': 'about',
        r'\barticulate\b': 'express',
        r'\bassert\b': 'state',
        r'\bassess\b': 'check',
        r'\bassessment\b': 'check',
        r'\bassistance\b': 'help',
        r'\bassist\b': 'help',
        r'\bassume\b': 'think',
        r'\battain\b': 'reach',
        r'\battempt\b': 'try',
        r'\bbeneficial\b': 'helpful',
        r'\bcapability\b': 'ability',
        r'\bcircumstances\b': 'situation',
        r'\bcommence\b': 'start',
        r'\bcommunicate\b': 'share',
        r'\bcomparable\b': 'similar',
        r'\bcompensate\b': 'make up for',
        r'\bcomplex\b': 'hard to understand',
        r'\bcomponent\b': 'part',
        r'\bcomprehend\b': 'understand',
        r'\bcomprehensive\b': 'complete',
        r'\bcomprise\b': 'include',
        r'\bconceive\b': 'think of',
        r'\bconcentrate\b': 'focus',
        r'\bconclude\b': 'end',
        r'\bconcurrent\b': 'at the same time',
        r'\bconduct\b': 'do',
        r'\bconfine\b': 'limit',
        r'\bconsequently\b': 'so',
        r'\bconsiderable\b': 'large',
        r'\bconsist\b': 'be made of',
        r'\bconstitute\b': 'make up',
        r'\bconstrain\b': 'limit',
        r'\bconstruct\b': 'build',
        r'\bconsume\b': 'use',
        r'\bcontain\b': 'have',
        r'\bcontemporary\b': 'modern',
        r'\bcontinue\b': 'keep',
        r'\bcontribute\b': 'add to',
        r'\bconvene\b': 'meet',
        r'\bconvert\b': 'change',
        r'\bcoordinate\b': 'organize',
        r'\bcore\b': 'main',
        r'\bcorrespond\b': 'match',
        r'\bcriteria\b': 'standards',
        r'\bcrucial\b': 'very important',
        r'\bdecrease\b': 'go down',
        r'\bdefine\b': 'explain',
        r'\bdemonstrate\b': 'show',
        r'\bdenote\b': 'mean',
        r'\bdepict\b': 'show',
        r'\bderive\b': 'get from',
        r'\bdesign\b': 'plan',
        r'\bdespite\b': 'even though',
        r'\bdetect\b': 'find',
        r'\bdetermine\b': 'find out',
        r'\bdeviate\b': 'differ',
        r'\bdiminish\b': 'reduce',
        r'\bdiscrete\b': 'separate',
        r'\bdisplay\b': 'show',
        r'\bdistinct\b': 'different',
        r'\bdistribute\b': 'spread',
        r'\bdominate\b': 'control',
        r'\bduration\b': 'length of time',
        r'\bdynamic\b': 'changing',
        r'\belement\b': 'part',
        r'\bemerge\b': 'come out',
        r'\bemphasize\b': 'stress',
        r'\benable\b': 'allow',
        r'\bencounter\b': 'meet',
        r'\benormous\b': 'very big',
        r'\bensure\b': 'make sure',
        r'\bentire\b': 'whole',
        r'\benvironment\b': 'surroundings',
        r'\bequivalent\b': 'equal',
        r'\berode\b': 'wear away',
        r'\bestablish\b': 'set up',
        r'\bevaluate\b': 'check',
        r'\beventual\b': 'final',
        r'\bevident\b': 'clear',
        r'\bevolve\b': 'develop',
        r'\bexceed\b': 'go beyond',
        r'\bexclude\b': 'leave out',
        r'\bexhibit\b': 'show',
        r'\bexpand\b': 'grow',
        r'\bexplicit\b': 'clear',
        r'\bexploit\b': 'use',
        r'\bexpose\b': 'show',
        r'\bextend\b': 'stretch',
        r'\bextract\b': 'take out',
        r'\bfacilitate\b': 'help',
        r'\bfactor\b': 'thing',
        r'\bfeature\b': 'part',
        r'\bfinal\b': 'last',
        r'\bfocus\b': 'center on',
        r'\bformulate\b': 'create',
        r'\bframework\b': 'structure',
        r'\bfrequently\b': 'often',
        r'\bfunction\b': 'work',
        r'\bfundamental\b': 'basic',
        r'\bfurthermore\b': 'also',
        r'\bgenerate\b': 'create',
        r'\bglobal\b': 'worldwide',
        r'\bguarantee\b': 'promise',
        r'\bguidelines\b': 'rules',
        r'\bhence\b': 'so',
        r'\bhierarchy\b': 'ranking',
        r'\bhighlight\b': 'point out',
        r'\bhypothesis\b': 'guess',
        r'\bidentical\b': 'same',
        r'\bidentify\b': 'find',
        r'\billustrate\b': 'show',
        r'\bimpact\b': 'effect',
        r'\bimplement\b': 'put in place',
        r'\bimplicit\b': 'implied',
        r'\bimply\b': 'suggest',
        r'\bimpose\b': 'force',
        r'\bincidence\b': 'rate',
        r'\binclination\b': 'tendency',
        r'\bincrease\b': 'go up',
        r'\bincur\b': 'cause',
        r'\bindicate\b': 'show',
        r'\bindividual\b': 'person',
        r'\binduce\b': 'cause',
        r'\binevitable\b': 'certain',
        r'\binfer\b': 'conclude',
        r'\binherent\b': 'built-in',
        r'\binitial\b': 'first',
        r'\binitiate\b': 'start',
        r'\binnovation\b': 'new idea',
        r'\binput\b': 'contribution',
        r'\binsert\b': 'put in',
        r'\binstance\b': 'example',
        r'\binstitute\b': 'set up',
        r'\binstruction\b': 'directions',
        r'\bintegrate\b': 'combine',
        r'\bintegrity\b': 'honesty',
        r'\bintelligence\b': 'thinking ability',
        r'\bintense\b': 'strong',
        r'\binteract\b': 'work together',
        r'\binternal\b': 'inside',
        r'\binterpret\b': 'explain',
        r'\binterval\b': 'time period',
        r'\bintervene\b': 'step in',
        r'\bintrinsic\b': 'built-in',
        r'\binvestigate\b': 'look into',
        r'\binvolve\b': 'include',
        r'\bisolate\b': 'separate',
        r'\bissue\b': 'problem',
        r'\bjustify\b': 'explain',
        r'\blabel\b': 'name',
        r'\blayer\b': 'level',
        r'\blegislation\b': 'laws',
        r'\bleverage\b': 'use',
        r'\blikewise\b': 'also',
        r'\blink\b': 'connect',
        r'\blocate\b': 'find',
        r'\blogic\b': 'reasoning',
        r'\bmaintain\b': 'keep',
        r'\bmajor\b': 'main',
        r'\bmanifest\b': 'show',
        r'\bmanipulate\b': 'control',
        r'\bmarginal\b': 'small',
        r'\bmature\b': 'grown up',
        r'\bmaximize\b': 'make the most of',
        r'\bmechanism\b': 'way',
        r'\bmediate\b': 'help settle',
        r'\bmedium\b': 'middle',
        r'\bmental\b': 'mind',
        r'\bmethod\b': 'way',
        r'\bmethodology\b': 'method',
        r'\bmigrate\b': 'move',
        r'\bminimize\b': 'reduce',
        r'\bminimum\b': 'least',
        r'\bmodify\b': 'change',
        r'\bmonitor\b': 'watch',
        r'\bmotivate\b': 'encourage',
        r'\bmutual\b': 'shared',
        r'\bnegate\b': 'cancel out',
        r'\bnetwork\b': 'group',
        r'\bneutral\b': 'unbiased',
        r'\bnevertheless\b': 'but',
        r'\bnorm\b': 'standard',
        r'\bnotion\b': 'idea',
        r'\bnotwithstanding\b': 'despite',
        r'\bnumerous\b': 'many',
        r'\bobjective\b': 'goal',
        r'\bobtain\b': 'get',
        r'\bobvious\b': 'clear',
        r'\boccur\b': 'happen',
        r'\boffset\b': 'balance',
        r'\bongoing\b': 'continuing',
        r'\boption\b': 'choice',
        r'\borient\b': 'direct',
        r'\boutcome\b': 'result',
        r'\boutput\b': 'result',
        r'\boverall\b': 'total',
        r'\boverlap\b': 'cover',
        r'\bparadigm\b': 'model',
        r'\bparameter\b': 'limit',
        r'\bparticipate\b': 'take part',
        r'\bpartner\b': 'work together',
        r'\bperceive\b': 'see',
        r'\bpercent\b': 'percent',
        r'\bperiod\b': 'time',
        r'\bpersist\b': 'continue',
        r'\bperspective\b': 'view',
        r'\bphenomenon\b': 'event',
        r'\bphilosophy\b': 'belief',
        r'\bphysical\b': 'body',
        r'\bpolicy\b': 'rule',
        r'\bportion\b': 'part',
        r'\bpose\b': 'present',
        r'\bpositive\b': 'good',
        r'\bpossess\b': 'have',
        r'\bpotential\b': 'possible',
        r'\bprecede\b': 'come before',
        r'\bprecise\b': 'exact',
        r'\bpredict\b': 'guess',
        r'\bpredominant\b': 'main',
        r'\bpreliminary\b': 'early',
        r'\bpresume\b': 'assume',
        r'\bprevious\b': 'earlier',
        r'\bprimary\b': 'main',
        r'\bprime\b': 'main',
        r'\bprincipal\b': 'main',
        r'\bprinciple\b': 'rule',
        r'\bprior\b': 'before',
        r'\bprior to\b': 'before',
        r'\bpriority\b': 'importance',
        r'\bprocedure\b': 'steps',
        r'\bproceed\b': 'go on',
        r'\bprocess\b': 'steps',
        r'\bprofessional\b': 'expert',
        r'\bprohibit\b': 'ban',
        r'\bproject\b': 'plan',
        r'\bpromote\b': 'support',
        r'\bproportion\b': 'part',
        r'\bprospect\b': 'possibility',
        r'\bprotocol\b': 'rules',
        r'\bprovide\b': 'give',
        r'\bpurchase\b': 'buy',
        r'\bpursue\b': 'chase',
        r'\bqualitative\b': 'describing qualities',
        r'\bquantitative\b': 'using numbers',
        r'\brange\b': 'variety',
        r'\bratio\b': 'comparison',
        r'\brational\b': 'logical',
        r'\breact\b': 'respond',
        r'\breceive\b': 'get',
        r'\brecognize\b': 'know',
        r'\brecommend\b': 'suggest',
        r'\breduce\b': 'lower',
        r'\brefer\b': 'point to',
        r'\brefine\b': 'improve',
        r'\bregard\b': 'see as',
        r'\bregime\b': 'system',
        r'\bregion\b': 'area',
        r'\bregulate\b': 'control',
        r'\breinforce\b': 'strengthen',
        r'\breject\b': 'refuse',
        r'\brelate\b': 'connect',
        r'\brelevant\b': 'related',
        r'\brely\b': 'depend',
        r'\bremain\b': 'stay',
        r'\bremove\b': 'take away',
        r'\brequire\b': 'need',
        r'\bresearch\b': 'study',
        r'\breside\b': 'live',
        r'\bresolve\b': 'solve',
        r'\bresource\b': 'supply',
        r'\brespond\b': 'answer',
        r'\brestore\b': 'bring back',
        r'\brestrain\b': 'hold back',
        r'\brestrict\b': 'limit',
        r'\bretain\b': 'keep',
        r'\breveal\b': 'show',
        r'\brevenue\b': 'income',
        r'\breverse\b': 'opposite',
        r'\brevise\b': 'change',
        r'\brevolution\b': 'big change',
        r'\bscale\b': 'size',
        r'\bschedule\b': 'plan',
        r'\bscheme\b': 'plan',
        r'\bscope\b': 'range',
        r'\bsection\b': 'part',
        r'\bsector\b': 'area',
        r'\bsecure\b': 'safe',
        r'\bseek\b': 'look for',
        r'\bselect\b': 'choose',
        r'\bsequence\b': 'order',
        r'\bseries\b': 'group',
        r'\bshift\b': 'change',
        r'\bsignificant\b': 'important',
        r'\bsimilar\b': 'alike',
        r'\bsimulate\b': 'imitate',
        r'\bsite\b': 'place',
        r'\bso-called\b': 'called',
        r'\bsource\b': 'where from',
        r'\bspecific\b': 'particular',
        r'\bspecify\b': 'state',
        r'\bsphere\b': 'area',
        r'\bstable\b': 'steady',
        r'\bstatistic\b': 'number',
        r'\bstatus\b': 'position',
        r'\bstrategy\b': 'plan',
        r'\bstress\b': 'pressure',
        r'\bstructure\b': 'organization',
        r'\bstyle\b': 'way',
        r'\bsubmit\b': 'send in',
        r'\bsubordinate\b': 'lower',
        r'\bsubsequent\b': 'later',
        r'\bsubsequently\b': 'then',
        r'\bsubsidy\b': 'payment',
        r'\bsubstitute\b': 'replace',
        r'\bsucceed\b': 'do well',
        r'\bsufficient\b': 'enough',
        r'\bsum\b': 'total',
        r'\bsummary\b': 'short version',
        r'\bsupplement\b': 'add to',
        r'\bsurvey\b': 'study',
        r'\bsurvive\b': 'live through',
        r'\bsustain\b': 'keep up',
        r'\bsymbol\b': 'sign',
        r'\btarget\b': 'goal',
        r'\btask\b': 'job',
        r'\btechnical\b': 'specialized',
        r'\btechnique\b': 'method',
        r'\btechnology\b': 'tools',
        r'\btemporary\b': 'for now',
        r'\btense\b': 'tight',
        r'\bterminate\b': 'end',
        r'\bterms\b': 'words',
        r'\btheme\b': 'topic',
        r'\btheory\b': 'idea',
        r'\bthereby\b': 'by this',
        r'\bthesis\b': 'main idea',
        r'\btopic\b': 'subject',
        r'\btrace\b': 'follow',
        r'\btradition\b': 'custom',
        r'\btransfer\b': 'move',
        r'\btransform\b': 'change',
        r'\btransition\b': 'change',
        r'\btransmit\b': 'send',
        r'\btransport\b': 'carry',
        r'\btrend\b': 'pattern',
        r'\btrigger\b': 'cause',
        r'\bultimate\b': 'final',
        r'\bunderlying\b': 'basic',
        r'\bundertake\b': 'do',
        r'\buniform\b': 'same',
        r'\bunique\b': 'one of a kind',
        r'\butilize\b': 'use',
        r'\bvalid\b': 'correct',
        r'\bvary\b': 'change',
        r'\bvehicle\b': 'car',
        r'\bversion\b': 'form',
        r'\bvia\b': 'through',
        r'\bviolate\b': 'break',
        r'\bvirtual\b': 'almost',
        r'\bvisible\b': 'can be seen',
        r'\bvision\b': 'plan',
        r'\bvisual\b': 'seen',
        r'\bvolume\b': 'amount',
        r'\bvoluntary\b': 'by choice',
        r'\bwhereas\b': 'while',
        r'\bwidespread\b': 'common',
        
        r'\bin order to\b': 'to',
        r'\bdue to the fact that\b': 'because',
        r'\bat this point in time\b': 'now',
        r'\bin the event that\b': 'if',
        r'\bfor the purpose of\b': 'to',
        r'\bin the vicinity of\b': 'near',
        r'\bwith regard to\b': 'about',
        r'\bin spite of\b': 'despite',
        r'\bin addition to\b': 'besides',
        r'\bin conjunction with\b': 'with',
        r'\bin accordance with\b': 'following',
        r'\bin terms of\b': 'about',
        r'\bwith respect to\b': 'about',
        r'\bas a result of\b': 'because of',
        r'\bon the basis of\b': 'based on',
        r'\bin the context of\b': 'in',
        r'\bfor the most part\b': 'mostly',
        r'\bto a large extent\b': 'mostly',
        r'\bin many cases\b': 'often',
        r'\ba number of\b': 'some',
        r'\ba variety of\b': 'different',
        r'\bthe majority of\b': 'most',
        r'\bin order that\b': 'so that',
    }
    
    for pattern, replacement in replacements.items():
        simplified = re.sub(pattern, replacement, simplified, flags=re.IGNORECASE)
    
    sentences = simplified.split('.')
    new_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        words = sentence.split()
        
        # Aggressive sentence breaking for cognitive accessibility
        if len(words) > 15:
            parts = re.split(r'[,;]\s*|\s+(?:and|but|or|because|which|that|while|when|if|without|although|however|therefore|moreover|furthermore)\s+', sentence, flags=re.IGNORECASE)
            
            for part in parts:
                part = part.strip()
                # Only keep parts that are meaningful (>3 words)
                if part and len(part.split()) >= 3:
                    part = part[0].upper() + part[1:] if len(part) > 1 else part.upper()
                    new_sentences.append(part)
        else:
            if len(words) >= 3:
                sentence = sentence[0].upper() + sentence[1:] if len(sentence) > 1 else sentence.upper()
                new_sentences.append(sentence)
    
    simplified = '. '.join(new_sentences) + '.'
    
    redundant_patterns = [
        r'\bin my opinion\b',
        r'\bit is important to note that\b',
        r'\bfor all intents and purposes\b',
        r'\bas a matter of fact\b',
        r'\bin actual fact\b',
        r'\bas you know\b',
        r'\bbasically\b',
        r'\bin particular\b',
        r'\bessentially\b',
        r'\bfundamentally\b',
        r'\bgenerally speaking\b',
        r'\bit goes without saying\b',
        r'\bneedless to say\b',
    ]
    
    for pattern in redundant_patterns:
        simplified = re.sub(pattern, '', simplified, flags=re.IGNORECASE)
    
    simplified = re.sub(r'\s+', ' ', simplified)  #Multiple spaces
    simplified = re.sub(r'\.+', '.', simplified)  #Multiple periods
    simplified = re.sub(r'\s+\.', '.', simplified)  #Space before period
    simplified = re.sub(r'\s+,', ',', simplified)  #Space before comma
    simplified = re.sub(r',\s*\.', '.', simplified)  #Comma followed by period
    simplified = re.sub(r'^\s*\.\s*', '', simplified)  #Leading period
    simplified = simplified.strip()
    
    simplified = re.sub(r'\bAI\b', 'AI (Artificial Intelligence)', simplified, count=1)
    simplified = re.sub(r'\bML\b', 'ML (Machine Learning)', simplified, count=1)
    simplified = re.sub(r'\bUDL\b', 'UDL (Universal Design for Learning)', simplified, count=1)
    simplified = re.sub(r'\bWCAG\b', 'WCAG (Web Content Accessibility Guidelines)', simplified, count=1)
    
    return {
        "success": True,
        "original": text,
        "simplified": simplified,
        "model": "cognitive-optimized-rule-based-v3",
        "readability_improvement": _calculate_readability_improvement(text, simplified)
    }
    
    simplified = '. '.join([s.strip() for s in new_sentences if s.strip()]) + '.'
    
    redundant_patterns = [
        r'\bin my opinion\b',
        r'\bit is important to note that\b',
        r'\bfor all intents and purposes\b',
        r'\bas a matter of fact\b',
        r'\bin actual fact\b',
        r'\bas you know\b',
        r'\bbasically\b',
    ]
    
    for pattern in redundant_patterns:
        simplified = re.sub(pattern, '', simplified, flags=re.IGNORECASE)
    
    simplified = re.sub(r'\s+', ' ', simplified)
    simplified = re.sub(r'\.+', '.', simplified)
    simplified = re.sub(r'\s+\.', '.', simplified)
    simplified = simplified.strip()
    
    return {
        "success": True,
        "original": text,
        "simplified": simplified,
        "model": "enhanced-rule-based",
        "readability_improvement": _calculate_readability_improvement(text, simplified)
    }

def _calculate_readability_improvement(original, simplified):
    """Calculate approximate readability improvement score"""
    def avg_word_length(text):
        words = text.split()
        if not words:
            return 0
        return sum(len(w) for w in words) / len(words)
    
    def avg_sentence_length(text):
        sentences = text.split('.')
        sentences = [s for s in sentences if s.strip()]
        if not sentences:
            return 0
        return sum(len(s.split()) for s in sentences) / len(sentences)
    
    orig_complexity = avg_word_length(original) * avg_sentence_length(original)
    simp_complexity = avg_word_length(simplified) * avg_sentence_length(simplified)
    
    if orig_complexity == 0:
        return 0
    
    improvement = ((orig_complexity - simp_complexity) / orig_complexity) * 100
    return round(max(0, min(100, improvement)), 1)

# basic simplification
# import os

# # Global model cache to avoid reloading
# _simplification_model = None
# _simplification_tokenizer = None


# def load_simplification_model():
#     """Load the text simplification model (cached for performance)"""
#     global _simplification_model, _simplification_tokenizer
    
#     if _simplification_model is None:
#         try:
#             from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            
#             # Using T5-base for better simplification quality (improved for cognitive accessibility)
#             # T5-base provides significantly better results than t5-small for cognitive disabilities
#             model_name = "t5-base"
            
#             print(f"Loading simplification model: {model_name}...")
#             _simplification_tokenizer = AutoTokenizer.from_pretrained(model_name)
#             _simplification_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
#             print("Simplification model loaded successfully!")
            
#         except Exception as e:
#             print(f"Error loading model: {e}")
#             return None, None
    
#     return _simplification_model, _simplification_tokenizer


# def simplify_text(text, max_length=150, min_length=30):
#     """
#     Simplify complex text for better readability.
    
#     Args:
#         text: Input text to simplify
#         max_length: Maximum length of simplified output
#         min_length: Minimum length of simplified output
    
#     Returns:
#         dict with original and simplified text
#     """
#     if not text or len(text.strip()) == 0:
#         return {
#             "success": False,
#             "original": text,
#             "simplified": "",
#             "error": "No text provided"
#         }
    
#     try:
#         model, tokenizer = load_simplification_model()
        
#         if model is None:
#             # Fallback to rule-based simplification
#             return _rule_based_simplification(text)
        
#         # Prepare input with task prefix optimized for cognitive accessibility
#         # Using "simplify for 5th grade reading level" produces better results than "summarize"
#         input_text = f"simplify for 5th grade reading level: {text}"
        
#         # Tokenize
#         inputs = tokenizer.encode(
#             input_text,
#             return_tensors="pt",
#             max_length=512,
#             truncation=True
#         )
        
#         # Generate simplified text
#         outputs = model.generate(
#             inputs,
#             max_length=max_length,
#             min_length=min_length,
#             length_penalty=2.0,
#             num_beams=4,
#             early_stopping=True
#         )
        
#         simplified = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
#         return {
#             "success": True,
#             "original": text,
#             "simplified": simplified,
#             "model": "t5-base",
#             "readability_improvement": _calculate_readability_improvement(text, simplified)
#         }
        
#     except ImportError:
#         return _rule_based_simplification(text)
#     except Exception as e:
#         return {
#             "success": False,
#             "original": text,
#             "simplified": "",
#             "error": str(e)
#         }


# def _rule_based_simplification(text):
#     """
#     Fallback rule-based simplification when ML model is unavailable.
#     Uses basic NLP techniques to simplify text.
#     """
#     import re
    
#     simplified = text
    
#     # Replace complex words with simpler alternatives
#     replacements = {
#         r'\butilize\b': 'use',
#         r'\bimplement\b': 'do',
#         r'\bfacilitate\b': 'help',
#         r'\bsubsequently\b': 'then',
#         r'\bnevertheless\b': 'but',
#         r'\bfurthermore\b': 'also',
#         r'\bconsequently\b': 'so',
#         r'\bapproximate(ly)?\b': 'about',
#         r'\bdemonstrate\b': 'show',
#         r'\bcommence\b': 'start',
#         r'\bterminate\b': 'end',
#         r'\bpurchase\b': 'buy',
#         r'\badditional\b': 'more',
#         r'\brequire\b': 'need',
#         r'\bassist\b': 'help',
#         r'\bobtain\b': 'get',
#         r'\bmodify\b': 'change',
#     }
    
#     for pattern, replacement in replacements.items():
#         simplified = re.sub(pattern, replacement, simplified, flags=re.IGNORECASE)
    
#     # Break long sentences (over 25 words)
#     sentences = simplified.split('.')
#     new_sentences = []
#     for sentence in sentences:
#         words = sentence.split()
#         if len(words) > 25:
#             # Split at common conjunctions
#             parts = re.split(r',\s*(?:and|but|or|which|that)\s+', sentence)
#             new_sentences.extend([p.strip() for p in parts if p.strip()])
#         else:
#             new_sentences.append(sentence.strip())
    
#     simplified = '. '.join([s for s in new_sentences if s]) + '.'
#     simplified = re.sub(r'\.+', '.', simplified)  # Remove multiple periods
    
#     return {
#         "success": True,
#         "original": text,
#         "simplified": simplified,
#         "model": "rule-based",
#         "readability_improvement": _calculate_readability_improvement(text, simplified)
#     }


# def _calculate_readability_improvement(original, simplified):
#     """Calculate approximate readability improvement score"""
#     def avg_word_length(text):
#         words = text.split()
#         if not words:
#             return 0
#         return sum(len(w) for w in words) / len(words)
    
#     def avg_sentence_length(text):
#         sentences = text.split('.')
#         sentences = [s for s in sentences if s.strip()]
#         if not sentences:
#             return 0
#         return sum(len(s.split()) for s in sentences) / len(sentences)
    
#     orig_complexity = avg_word_length(original) * avg_sentence_length(original)
#     simp_complexity = avg_word_length(simplified) * avg_sentence_length(simplified)
    
#     if orig_complexity == 0:
#         return 0
    
#     improvement = ((orig_complexity - simp_complexity) / orig_complexity) * 100
#     return round(max(0, min(100, improvement)), 1)