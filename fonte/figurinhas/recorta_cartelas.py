import sys, glob, collections
from PIL import Image
D="/Users/tiagoroity/Downloads/fotos-ck-life/"; OUT=sys.argv[1]
white=lambda p: p[0]>=251 and p[1]>=251 and p[2]>=249
files=sorted(glob.glob(D+"Imagem do ChatGPT 23 de out*"))
log=[]
for f in files:
    im=Image.open(f).convert("RGB"); W,H=im.size; px=im.load()
    amostra=sorted(sum(px[x,y])/3 for x in range(0,W,7) for y in list(range(2,22,4))+list(range(H-20,H-2,4)))
    bgL=amostra[len(amostra)//2]; lim=bgL+2.6
    white=lambda p, lim=lim: (p[0]+p[1]+p[2])/3>=lim and min(p)>=lim-9
    def fundo(p, bgL=bgL, lim=lim):
        L=(p[0]+p[1]+p[2])/3; s=max(p)-min(p)
        return L < lim and L >= bgL-48 and s <= 13
    print(f[-6:], "fundo", round(bgL,1), "limite branco", round(lim,1))
    top,bot=92,1390; ch=(bot-top)/5; cw=W/4
    for r in range(5):
        for c in range(4):
            cx1,cy1,cx2,cy2=int(c*cw),int(top+r*ch),int((c+1)*cw),int(top+(r+1)*ch)
            M=26; X1,Y1,X2,Y2=max(0,cx1-M),max(0,cy1-M),min(W,cx2+M),min(H,cy2+M); w,h=X2-X1,Y2-Y1
            out=bytearray(w*h); dq=collections.deque([(x,0) for x in range(w)]+[(x,h-1) for x in range(w)]+[(0,y) for y in range(h)]+[(w-1,y) for y in range(h)])
            while dq:
                x,y=dq.popleft(); i=y*w+x
                p=px[X1+x,Y1+y]
                if out[i] or not fundo(p): continue
                out[i]=1
                if x>0: dq.append((x-1,y))
                if x<w-1: dq.append((x+1,y))
                if y>0: dq.append((x,y-1))
                if y<h-1: dq.append((x,y+1))
            lab=[0]*(w*h); best=None; n=0
            for y0 in range(h):
                for x0 in range(w):
                    i0=y0*w+x0
                    if out[i0] or lab[i0]: continue
                    n+=1; st=[(x0,y0)]; lab[i0]=n; a=0; sx=sy=0; b=[x0,y0,x0,y0]
                    while st:
                        x,y=st.pop(); a+=1; sx+=x; sy+=y
                        b[0]=min(b[0],x); b[1]=min(b[1],y); b[2]=max(b[2],x); b[3]=max(b[3],y)
                        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                            if 0<=nx<w and 0<=ny<h:
                                j=ny*w+nx
                                if not out[j] and not lab[j]: lab[j]=n; st.append((nx,ny))
                    mx,my=X1+sx/a,Y1+sy/a
                    if cx1<=mx<cx2 and cy1<=my<cy2 and (best is None or a>best[1]): best=(n,a,b)
            n,a,b=best; P=12
            bx1,by1,bx2,by2=max(0,b[0]-P),max(0,b[1]-P),min(w-1,b[2]+P),min(h-1,b[3]+P)
            o=Image.new("RGBA",(bx2-bx1+1,by2-by1+1)); op=o.load()
            from PIL import ImageFilter
            mk=Image.new("L",o.size,0); mp=mk.load()
            for y in range(by1,by2+1):
                for x in range(bx1,bx2+1):
                    if lab[y*w+x]==n: mp[x-bx1,y-by1]=255
            perto=mk.filter(ImageFilter.MaxFilter(21)).load()
            for y in range(by1,by2+1):
                for x in range(bx1,bx2+1):
                    i=y*w+x; rr,gg,bb=px[X1+x,Y1+y]
                    if lab[i]==n: op[x-bx1,y-by1]=(rr,gg,bb,255)
                    elif out[i] and perto[x-bx1,y-by1]:
                        L=(rr+gg+bb)/3; s=max(rr,gg,bb)-min(rr,gg,bb)
                        al=int(max(0,min(90,(bgL-1-L)*4))) if s<16 else 0
                        op[x-bx1,y-by1]=(24,40,34,al)
            # pacote real: arquivo -1 = pack 5 ... -5 = pack 1
            pk=6-int(f[-5]); o.save(f"{OUT}/p{pk}_{r*4+c+1:02d}.png"); log.append((pk,r*4+c+1,a,o.size))
small=[l for l in log if l[2]<15000]
print(len(log),"recortes; suspeitos (área pequena):", small[:10])
